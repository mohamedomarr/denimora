from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.urls import reverse
from django.utils.html import strip_tags
from orders.models import Order
import logging

logger = logging.getLogger(__name__)

def _get_admin_emails():
    """Return list of admin recipient emails for notifications."""
    try:
        # Prefer explicit setting if provided
        emails = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', None)
        if emails:
            return [email.strip() for email in emails if isinstance(email, str) and email.strip()]

        # Fallback to Django ADMINS setting
        admins = getattr(settings, 'ADMINS', None)
        if admins:
            return [email for (_, email) in admins if email]

        # Final fallback: send to the configured sender mailbox
        if getattr(settings, 'EMAIL_HOST_USER', None):
            return [settings.EMAIL_HOST_USER]
    except Exception:
        pass
    return []

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
        
        # Send the email to customer
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            html_message=html_message,
            fail_silently=False,
        )
        print("Confirmation email sent successfully")

        # Send admin notification (HTML template + plain text fallback)
        try:
            admin_recipients = _get_admin_emails()
            if admin_recipients:
                admin_subject = f"New Order #{order.id} — {order.first_name} {order.last_name}"
                admin_html = render_to_string('orders/email/admin_new_order.html', {
                    'order': order,
                    'site_url': settings.SITE_URL,
                })
                admin_plain = strip_tags(admin_html)
                send_mail(
                    subject=admin_subject,
                    message=admin_plain,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_recipients,
                    html_message=admin_html,
                    fail_silently=False,
                )
                print("Admin new-order notification sent successfully")
        except Exception as admin_ex:
            print(f"Error sending admin new-order notification: {str(admin_ex)}")
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
        
        # Send the email to customer
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.email],
            html_message=html_message,
            fail_silently=False,
        )
        print("Status update email sent successfully")

        # Send admin notification of status change (HTML template + plain text fallback)
        try:
            admin_recipients = _get_admin_emails()
            if admin_recipients:
                admin_subject = f"Order #{order.id} status: {order.get_status_display}"
                admin_html = render_to_string('orders/email/admin_order_status_update.html', {
                    'order': order,
                    'site_url': settings.SITE_URL,
                })
                admin_plain = strip_tags(admin_html)
                send_mail(
                    subject=admin_subject,
                    message=admin_plain,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_recipients,
                    html_message=admin_html,
                    fail_silently=False,
                )
                print("Admin status-update notification sent successfully")
        except Exception as admin_ex:
            print(f"Error sending admin status-update notification: {str(admin_ex)}")
    except Exception as e:
        print(f"Error in send_order_status_update_email: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise 