from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ItemViewSet, OrderViewSet, health_check

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'items', ItemViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health-check'),
]