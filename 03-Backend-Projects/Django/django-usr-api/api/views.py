from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import connection
from .models import User, Item, Order
from .serializers import UserSerializer, ItemSerializer, OrderSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    @action(detail=False, methods=['get'])
    def in_stock(self, request):
        """Custom endpoint: /api/items/in_stock/"""
        items = Item.objects.filter(stock__gt=0)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        # decrease stock when an order is created
        item_id = request.data.get('item')
        quantity = int(request.data.get('quantity', 1))

        try:
            item = Item.objects.get(id=item_id)
        except Item.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

        if item.stock < quantity:
            return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)

        item.stock -= quantity
        item.save()

        return super().create(request, *args, **kwargs)


def health_check(request):
    """Health endpoint for Kubernetes readiness/liveness probes"""
    from django.http import JsonResponse
    try:
        connection.ensure_connection()
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"

    return JsonResponse({
        'status': 'healthy' if db_status == 'healthy' else 'unhealthy',
        'database': db_status,
        'version': '1.0.0',
    }, status=200 if db_status == 'healthy' else 503)