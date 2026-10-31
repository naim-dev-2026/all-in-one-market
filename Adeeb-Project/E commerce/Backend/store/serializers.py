from rest_framework import serializers
from .models import Category, Product, Order, OrderItem
from django.contrib.auth import get_user_model

User = get_user_model()

# ==========================================
# 📦 EXISTING CATALOG SERIALIZERS
# ==========================================

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'title',
            'description',
            'price',
            'sale_price',
            'inventory',
            'image',
            'is_active'
        ]


# ==========================================
# 🚚 NEW ORDERS & DISPATCH SYSTEM SERIALIZERS
# ==========================================

class OrderUserSerializer(serializers.ModelSerializer):
    """Provides essential customer demographic data for the merchant invoice header."""
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name']


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializes the product details and purchase price inside an individual order."""
    product_title = serializers.ReadOnlyField(source='product.title')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_title', 'quantity', 'price_at_purchase']


class MerchantOrderSerializer(serializers.ModelSerializer):
    """The master compiler handling corporate administrative order pipelines."""
    customer = OrderUserSerializer(source='user', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 
            'customer', 
            'items', 
            'total_amount', 
            'status', 
            'shipping_address', 
            'contact_phone', 
            'created_at'
        ]
        read_only_fields = ['total_amount', 'shipping_address', 'contact_phone', 'created_at']

