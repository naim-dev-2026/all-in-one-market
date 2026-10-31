import hmac

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

# 📡 IMPORT THE PRODUCT MODEL FOR OUR SEARCH AUTO-SUGGEST ENGINE
from store.models import Product 
from .serializers import UserRegisterSerializer, CustomTokenObtainPairSerializer

User = get_user_model()


class UserRegisterView(APIView):
    """Registers customers. Owner (staff) accounts require a secret owner key."""

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        account_type = request.data.get("account_type", "customer")
        is_vendor = False

        if account_type == "vendor":
            expected_key = getattr(settings, "OWNER_SIGNUP_KEY", "")
            provided_key = str(request.data.get("owner_key", ""))
            if not expected_key or not hmac.compare_digest(provided_key, expected_key):
                return Response(
                    {"error": "Invalid owner key."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            is_vendor = True

        serializer = UserRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()
                if is_vendor:
                    user.is_staff = True
                    user.is_superuser = False
                    user.save()

            return Response(
                {
                    "message": "Registration successful!",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "full_name": getattr(user, "full_name", ""),
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError:
            return Response(
                {"error": "An account with this email already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"error": "An unexpected system issue occurred."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserLoginView(TokenObtainPairView):
    """Processes user logins and returns JWT tokens plus profile permission fields."""

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


# =====================================================================
# 🔍 NEW: PORTFOLIO-READY LIGHTWEIGHT PRODUCT AUTOCOMPLETE SUGGESTIONS
# =====================================================================
class ProductAutocompleteView(APIView):
    """
    Returns a fast list of matching product titles as the user types.
    Optimized to query only active inventory titles to minimize DB load.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        if not query or len(query) < 2:
            return Response([], status=status.HTTP_200_OK)

        # ⚡ PERFORMANCE OPTIMIZATION: only fetch 'id' and 'title' fields from PostgreSQL
        suggestions = Product.objects.filter(
            title__icontains=query, 
            is_active=True
        ).values('id', 'title')[:8]  # Limit to top 8 entries for a clean UI dropdown

        return Response(list(suggestions), status=status.HTTP_200_OK)
