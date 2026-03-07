from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the built-in Django User model.
    We expose a limited set of fields — never the password hash.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined"]
        read_only_fields = ["date_joined"]


class PostSerializer(serializers.ModelSerializer):
    """
    Serializer for Post.

    - author is read-only: it's set automatically to request.user in the view.
    - author_username is a SerializerMethodField: it adds a computed field
      so the API response includes the author's name without a nested object.
    """

    author = serializers.PrimaryKeyRelatedField(read_only=True)
    author_username = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "author",
            "author_username",
            "published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_author_username(self, obj):
        return obj.author.username