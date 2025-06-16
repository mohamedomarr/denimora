from django.urls import path
from . import views

urlpatterns = [
    path('', views.cart_detail, name='api_cart_detail'),
    path('add/', views.cart_add, name='api_cart_add'),
    path('remove/', views.cart_remove, name='api_cart_remove'),
    path('clear/', views.cart_clear, name='api_cart_clear'),
    
    # NEW RESERVATION ENDPOINTS
    path('reserve/', views.reserve_item, name='api_reserve_item'),
    path('release/<int:reservation_id>/', views.release_reservation, name='api_release_reservation'),
    path('validate-stock/', views.validate_cart_stock, name='api_validate_cart_stock'),
    path('validate-checkout/', views.validate_checkout, name='api_validate_checkout'),
    path('cleanup-expired/', views.cleanup_expired_reservations, name='api_cleanup_expired'),
] 