from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    """Custom user model - extends Django's built-in user"""
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.username
    
class Item(models.Model):
    """Product/item that can be ordered"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['-created_at']
        

class Order(models.Model):
    """Order placed by a user for an item"""
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        SHIPPED = 'shipped', 'Shipped'
        DELIVERED = 'delivered', 'Delivered'
        CANCELLED = 'cancelled', 'Cancelled'
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                             related_name='orders')
    item = models.ForeignKey(Item, on_delete=models.CASCADE, 
                             related_name='orders')
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, 
                              default=Status.PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        # auto-calculate total price
        if not self.total_price:
            self.total_price = self.item.price * self.quantity
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"
    
    class Meta:
        ordering = ['-created_at']