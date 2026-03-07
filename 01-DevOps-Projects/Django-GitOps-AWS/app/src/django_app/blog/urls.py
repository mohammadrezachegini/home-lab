from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, UserViewSet

# DefaultRouter auto-generates all URL patterns for a ViewSet.
# You don't manually write path() for list/detail/create/update/delete.
router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("", include(router.urls)),
]