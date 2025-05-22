from django.urls import path
from . import views

urlpatterns = [
    path('', views.cart_detail, name='api_cart_detail'),
    path('add/', views.cart_add, name='api_cart_add'),
    path('remove/', views.cart_remove, name='api_cart_remove'),
    path('clear/', views.cart_clear, name='api_cart_clear'),
] 