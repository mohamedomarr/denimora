from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import EmailSubscription, ContactMessage, EmailList
from .utils import add_to_email_list

# Create your views here.

@api_view(['POST'])
@permission_classes([AllowAny])
def subscribe_email(request):
    """
    Handle email subscription from popup or footer
    """
    email = request.data.get('email', '').strip().lower()
    source = request.data.get('source', 'popup')  # 'popup', 'footer'
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    email_validator = EmailValidator()
    try:
        email_validator(email)
    except ValidationError:
        return Response({
            'success': False,
            'error': 'Please enter a valid email address'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is authenticated
    user = request.user if request.user.is_authenticated else None
    
    try:
        # Create or get email subscription
        subscription, created = EmailSubscription.objects.get_or_create(
            email=email,
            defaults={
                'source': source,
                'user': user,
                'is_active': True
            }
        )
        
        if not created:
            # Reactivate if it was previously deactivated
            if not subscription.is_active:
                subscription.is_active = True
                subscription.unsubscribed_at = None
                subscription.save()
                message = f"Welcome back! You've been resubscribed to our newsletter."
            else:
                message = "You're already subscribed to our newsletter."
        else:
            message = "Thank you for subscribing to our newsletter!"
        
        # Add to consolidated email list
        add_to_email_list(
            email=email,
            name='',  # No name available from subscription
            source=source,
            user=user,
            increment_subscription=True
        )
        
        return Response({
            'success': True,
            'message': message,
            'email': email
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to subscribe. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_contact_message(request):
    """
    Handle contact form submission
    """
    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip().lower()
    message = request.data.get('message', '').strip()
    
    # Validation
    errors = {}
    
    if not name:
        errors['name'] = 'Name is required'
    elif len(name) < 3:
        errors['name'] = 'Name must be at least 3 characters'
    
    if not email:
        errors['email'] = 'Email is required'
    else:
        email_validator = EmailValidator()
        try:
            email_validator(email)
        except ValidationError:
            errors['email'] = 'Please enter a valid email address'
    
    if not message:
        errors['message'] = 'Message is required'
    elif len(message) > 500:  # Increased limit for contact messages
        errors['message'] = 'Message should not exceed 500 characters'
    
    if errors:
        return Response({
            'success': False,
            'errors': errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user is authenticated
    user = request.user if request.user.is_authenticated else None
    
    try:
        # Create contact message
        contact_message = ContactMessage.objects.create(
            name=name,
            email=email,
            message=message,
            user=user,
            status='new'
        )
        
        # Add to consolidated email list
        add_to_email_list(
            email=email,
            name=name,
            source='contact',
            user=user,
            increment_message=True
        )
        
        return Response({
            'success': True,
            'message': "Thank you for your message! We'll get back to you soon.",
            'id': contact_message.id
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to send message. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def unsubscribe_email(request):
    """
    Handle email unsubscription
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        subscription = EmailSubscription.objects.get(email=email, is_active=True)
        subscription.is_active = False
        subscription.unsubscribed_at = timezone.now()
        subscription.save()
        
        # Update consolidated email list
        try:
            email_entry = EmailList.objects.get(email=email)
            if 'subscription' in email_entry.sources:
                email_entry.sources.remove('subscription')
                email_entry.save()
        except EmailList.DoesNotExist:
            pass
        
        return Response({
            'success': True,
            'message': 'You have been successfully unsubscribed.'
        }, status=status.HTTP_200_OK)
        
    except EmailSubscription.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Email not found in our subscription list.'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Failed to unsubscribe. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
