from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from .models import Post
from .serializers import PostSerializer, UserSerializer


class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission:
    - Anyone can read (GET, HEAD, OPTIONS).
    - Only the post's author can edit or delete it.

    This is a common pattern in REST APIs. We write it once here
    and attach it to the ViewSet below.
    """

    def has_object_permission(self, request, view, obj):
        # Safe methods (read) are allowed for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write is only allowed for the post's author
        return obj.author == request.user


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post CRUD.

    ModelViewSet automatically gives us:
      GET    /api/posts/        → list
      POST   /api/posts/        → create
      GET    /api/posts/{id}/   → retrieve
      PUT    /api/posts/{id}/   → update
      PATCH  /api/posts/{id}/   → partial update
      DELETE /api/posts/{id}/   → destroy

    We override perform_create to automatically set the author
    to the currently logged-in user.
    """

    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsAuthorOrReadOnly,
    ]

    def perform_create(self, serializer):
        # Inject the authenticated user as the author on save
        serializer.save(author=self.request.user)

    def get_queryset(self):
        """
        Optionally filter by ?published=true or ?author=<username>
        so the API is more useful for a frontend.
        """
        qs = Post.objects.select_related("author")  # avoids N+1 queries
        published = self.request.query_params.get("published")
        author = self.request.query_params.get("author")

        if published is not None:
            qs = qs.filter(published=published.lower() == "true")
        if author:
            qs = qs.filter(author__username=author)

        return qs


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for User.
    ReadOnlyModelViewSet gives us list + retrieve but no create/update/delete.
    Users are managed via Django admin or a separate registration flow.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]