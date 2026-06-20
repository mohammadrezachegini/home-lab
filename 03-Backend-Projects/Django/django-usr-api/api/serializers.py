from rest_framework import serializers
from .models import User, Item, Order


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at']


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'price', 'stock', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        

class OrderSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'username', 'item', 'item_name',
            'quantity', 'status', 'total_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at', 'updated_at']