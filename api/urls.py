from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import api_health_check

urlpatterns = [
    # JWT Authentication
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Health check endpoint
    path('health/', api_health_check, name='api_health_check'),
    
    # API endpoints for different apps
    path('products/', include('api.products.urls')),
    path('cart/', include('api.cart.urls')),
    path('orders/', include('api.orders.urls')),
    path('users/', include('api.users.urls')),
] 