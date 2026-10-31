from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # The slug handles clean e-commerce URLs (e.g. /products/smart-phones/)
    slug = models.SlugField(max_length=120, unique=True, blank=True)

    class Meta:
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Pricing setup supporting item discounts
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Inventory manager to track warehouse counts
    inventory = models.PositiveIntegerField(default=1)

    # Image upload configuration
    image = models.ImageField(upload_to='products/', null=True, blank=True)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


# ==========================================
# 🚚 NEW DATABASE TABLES FOR ORDERS SYSTEM
# ==========================================

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending / Processing'),
        ('shipped', 'Shipped / In Transit'),
        ('delivered', 'Delivered to Destination'),
        ('cancelled', 'Cancelled'),
    ]

    # Links the order directly to the custom user profile model
    user = models.ForeignKey('accounts.User', on_delete=models.PROTECT, related_name='orders')
    
    # Financial and tracking parameters
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Shipping info provided by the customer at checkout
    shipping_address = models.TextField()
    contact_phone = models.CharField(max_length=20)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - User: {self.user.email} ({self.status})"


class OrderItem(models.Model):
    """Tracks individual product quantities inside a single customer order basket."""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.product.title} in Order #{self.order.id}"
