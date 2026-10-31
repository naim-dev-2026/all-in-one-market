from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug")
    # Automatically types out the slug while you type the name field!
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "category", "price", "sale_price", "inventory", "is_active")
    list_filter = ("is_active", "category")
    search_fields = ("title", "description")
    list_editable = ("price", "sale_price", "inventory", "is_active")  # Allows fast spreadsheet edits!
    readonly_fields = ("created_at", "updated_at")


