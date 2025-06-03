from django.urls import path
from . import views

urlpatterns = [
    path('', views.OrderListView.as_view(), name='api_order_list'),
    path('create/', views.create_order, name='api_order_create'),
    path('<int:order_id>/', views.OrderDetailView.as_view(), name='api_order_detail'),
    # New shipping cost endpoints
    path('shipping-cost/', views.get_shipping_cost, name='api_shipping_cost'),
    path('governorates/', views.list_governorates_shipping, name='api_governorates_shipping'),
] 