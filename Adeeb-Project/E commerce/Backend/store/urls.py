from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, MerchantOrderViewSet, CheckoutView

# Routers automatically map standard layout viewsets to standard clean REST URLs
router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('products', ProductViewSet, basename='product')

# 📡 Live administration order pipeline link endpoint
router.register('merchant/orders', MerchantOrderViewSet, basename='merchant-order')

urlpatterns = [
    path('', include(router.urls)),
    # 📡 Public consumer endpoint path for order submissions
    path('checkout/', CheckoutView.as_view(), name='customer-checkout'),
]


