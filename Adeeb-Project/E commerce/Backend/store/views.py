from django.db import models
from django.db.models import Q
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication # 🚀 IMPORTED JWT AUTHENTICATION
from .models import Category, Product, Order, OrderItem
from .serializers import CategorySerializer, ProductSerializer, MerchantOrderSerializer


class IsStaffOrReadOnly(BasePermission):
    """
    Everyone can view (GET, HEAD, OPTIONS).
    Only logged-in staff (owners) can create, edit or delete.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    Anyone can list categories. Only staff can manage them.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]


class ProductViewSet(viewsets.ModelViewSet):
    """
    Customers see only active products. Staff see everything and can
    create, edit or delete. MultiPartParser and FormParser handle
    image uploads from React.
    
    📡 INTEGRATED ADVANCED FULL-STACK SEARCH ENGINE FILTER MODULE
    """
    serializer_class = ProductSerializer
    permission_classes = [IsStaffOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Product.objects.select_related('category').order_by('-created_at')
        
        # 1. First, secure visibility rules based on authentication status roles
        user = self.request.user
        if not (user and user.is_authenticated and user.is_staff):
            queryset = queryset.filter(is_active=True)
            
        # 2. Extract query parameter keys sent via the URL from the React search box
        search_query = self.request.query_params.get('search', None)
        category_filter = self.request.query_params.get('category', None)

        # 3. 🧠 DYNAMIC POSTGRESQL MULTI-COLUMN SEARCH LOOKUP MATRIX
        if search_query:
            search_query = search_query.strip()
            queryset = queryset.filter(
                Q(title__icontains=search_query) |          # Case-insensitive title match
                Q(description__icontains=search_query) |    # Case-insensitive description match
                Q(category__name__icontains=search_query)   # Scans across related category names
            )

        # 4. Strict drop-down category isolation selection filter
        if category_filter and category_filter != 'all':
            queryset = queryset.filter(category_id=category_filter)

        return queryset


# ==========================================
# 🚚 NEW ORDERS & DISPATCH SYSTEM VIEWSET
# ==========================================

class MerchantOrderViewSet(viewsets.ModelViewSet):
    """
    🔒 Restricted Merchant Order Portal:
    - Restricts complete querysets and operations exclusively to staff/owners (IsAdminUser).
    - Allows merchants to audit full incoming buyer history queues and execute dispatch state adjustments.
    """
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = MerchantOrderSerializer
    permission_classes = [IsAdminUser]

    def perform_update(self, serializer):
        # Saves the modified dispatch status variable cleanly down into database tables
        serializer.save()


# ==========================================
# 🛒 NEW CUSTOMER CHECKOUT ENGINE PROCESSING LAYER
# ==========================================

class CheckoutView(APIView):
    """
    🔐 Secure Customer Checkout Engine:
    - Restricts operations exclusively to authenticated shoppers (IsAuthenticated).
    - Uses atomicity blocks (transaction.atomic) to handle multiple database updates safely.
    """
    authentication_classes = [JWTAuthentication] # 🚀 BUG FIX: Forces Django to read the incoming token header!
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart_items = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address', '').strip()
        contact_phone = request.data.get('contact_phone', '').strip()

        if not cart_items:
            return Response({'error': 'Your shopping basket is completely empty.'}, status=status.HTTP_400_BAD_REQUEST)
        if not shipping_address or not contact_phone:
            return Response({'error': 'Please provide a valid delivery address and contact line.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                total_amount = 0
                # Create the core order wrapper sheet record
                order = Order.objects.create(
                    user=request.user,
                    total_amount=0,  # Will be updated following product row validation loops
                    shipping_address=shipping_address,
                    contact_phone=contact_phone,
                    status='pending'
                )

                for item in cart_items:
                    product_id = item.get('id')
                    quantity = int(item.get('quantity', 1))

                    # Query and lock row data safely from PostgreSQL database grids
                    product = Product.objects.select_for_update().get(id=product_id)

                    # Validation Stock Level Rule Safeguards
                    if product.inventory < quantity:
                        raise Exception(f'Insufficient warehouse stock for product "{product.title}". Only {product.inventory} items left.')

                    # Calculate exact item price rules supporting target sale discount markdowns
                    price = product.sale_price if (product.sale_price is not None) else product.price
                    item_total = price * quantity
                    total_amount += item_total

                    # Deduct quantity from your inventory manager columns
                    product.inventory -= quantity
                    product.save()

                    # Save individual entry rows into order items tables
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        price_at_purchase=price
                    )

                # Commit finalized financial calculations down into the master invoice model
                order.total_amount = total_amount
                order.save()

            return Response({
                'message': 'Order processed successfully!',
                'order_id': order.id,
                'total_paid': str(total_amount)
            }, status=status.HTTP_201_CREATED)

        except Product.DoesNotExist:
            return Response({'error': 'A requested item does not exist inside our warehouse records.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
