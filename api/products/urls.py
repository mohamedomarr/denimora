from django.urls import path
from . import views

urlpatterns = [
    path('', views.product_list, name='api_product_list'),
    path('<int:id>/<slug:slug>/', views.product_detail, name='api_product_detail'),
    path('categories/', views.category_list, name='api_category_list'),
] 