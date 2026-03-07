from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    """
    A blog post. Owned by a User (Django's built-in auth user).

    We reference User with a ForeignKey so each post has an author.
    on_delete=CASCADE means if the user is deleted, their posts go too.
    """

    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts",  # lets us do user.posts.all()
    )
    created_at = models.DateTimeField(auto_now_add=True)  # set once on creation
    updated_at = models.DateTimeField(auto_now=True)      # updated on every save
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]  # newest posts first

    def __str__(self):
        return f"{self.title} — {self.author.username}"