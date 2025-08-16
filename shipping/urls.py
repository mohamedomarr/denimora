from django.urls import path
from . import views

app_name = 'shipping'

urlpatterns = [
    # Bosta webhook endpoint
    path('bosta/webhook/', views.bosta_webhook, name='bosta_webhook'),
    
    # Public tracking page
    path('track/', views.tracking_page, name='tracking_page'),
    path('track/<str:tracking_number>/', views.tracking_page, name='tracking_page_with_number'),
    
    # API endpoints for frontend
    path('api/tracking/<str:tracking_number>/', views.get_tracking_info, name='tracking_info'),
    path('api/shipments/', views.list_shipments, name='list_shipments'),
    path('api/shipments/<int:order_id>/create/', views.create_shipment, name='create_shipment'),
    
    # Admin tools
    path('admin/sync-tracking/', views.sync_all_tracking, name='sync_tracking'),
    path('admin/test-bosta/', views.test_bosta_connection, name='test_bosta'),
] 