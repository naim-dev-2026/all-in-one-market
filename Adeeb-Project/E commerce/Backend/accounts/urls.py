from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import UserRegisterView, UserLoginView, ProductAutocompleteView

urlpatterns = [
    path('register/', UserRegisterView.as_view(), name='user-register'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    # 🔍 Live search auto-suggestions API route mapped safely here
    path('autocomplete/', ProductAutocompleteView.as_view(), name='product-autocomplete'),
]



