from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from django.utils.html import strip_tags
from orders.models import Order
import logging

logger = logging.getLogger(__name__)

def send_order_confirmation_email(order):
    """
    Send order confirmation email to customer
    """

    # Reload order with items
    

    try:
        subject = f'Order Confirmation - DENIMORA Order #{order.id}'
        
        # Get the absolute URL for the logo
        logo_url = f"{settings.SITE_URL}/static/Assets/Logos&Icons/DenimaraLogoNavyNg.svg"
        
        # Render the email template
        html_message = render_to_string('orders/email/order_confirmation.html', {
            'order': order,
            'logo_url': logo_url,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        print(f"Sending confirmation email to {order.email}")
        print(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
        
        # Send the email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            html_message=html_message,
            fail_silently=False,
        )
        print("Confirmation email sent successfully")
    except Exception as e:
        print(f"Error in send_order_confirmation_email: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise

def send_order_status_update_email(order):
    """
    Send order status update email to customer
    """

    # Reload order with items
    order = Order.objects.prefetch_related('items', 'items__product').get(pk=order.pk)
    

    try:
        subject = f'Order Status Update - DENIMORA Order #{order.id}'
        
        # Get the absolute URL for the logo
        logo_url = f"{settings.SITE_URL}/static/Assets/Logos&Icons/DenimaraLogoNavyNg.svg"
        
        # Render the email template
        html_message = render_to_string('orders/email/order_status_update.html', {
            'order': order,
            'logo_url': logo_url,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        print(f"Sending status update email to {order.email}")
        print(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}, USER={settings.EMAIL_HOST_USER}")
        
        # Send the email
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            html_message=html_message,
            fail_silently=False,
        )
        print("Status update email sent successfully")
    except Exception as e:
        print(f"Error in send_order_status_update_email: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise 