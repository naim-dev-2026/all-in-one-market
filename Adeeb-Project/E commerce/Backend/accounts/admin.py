from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User  # Must import User

class CustomUserProfileAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'phone_number', 'birth_year', 'has_agreed_to_terms', 'is_staff')
    list_filter = ('has_agreed_to_terms', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'full_name', 'phone_number')
    ordering = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('E-Commerce Profile Information', {
            'fields': ('full_name', 'phone_number', 'address', 'birth_year'),
        }),
        ('Legal Compliance Tracking', {
            'fields': ('has_agreed_to_terms', 'terms_agreed_at'),
            'description': 'Monitors legal terms of service confirmation dates.',
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'phone_number', 'address', 'birth_year', 'has_agreed_to_terms'),
        }),
    )

    readonly_fields = ['terms_agreed_at']

admin.site.register(User, CustomUserProfileAdmin)  # Must register User
