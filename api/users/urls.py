from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='api_register'),
    path('profile/', views.get_user_profile, name='api_user_profile'),
    path('profile/update/', views.update_user_profile, name='api_update_profile'),
] 