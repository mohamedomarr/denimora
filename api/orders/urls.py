from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='api_order_list'),
    path('create/', views.OrderCreateView.as_view(), name='api_order_create'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='api_order_detail'),
] 