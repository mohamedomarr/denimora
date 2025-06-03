from django.urls import path
from . import views

app_name = 'communications'

urlpatterns = [
    path('subscribe/', views.subscribe_email, name='subscribe_email'),
    path('contact/', views.submit_contact_message, name='submit_contact_message'),
    path('unsubscribe/', views.unsubscribe_email, name='unsubscribe_email'),
] 