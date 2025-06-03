from django.contrib.auth.models import User
from .models import EmailList

def add_to_email_list(email, name='', source='', user=None, increment_subscription=False, increment_message=False, increment_order=False):
    """
    Add or update an email in the consolidated email list
    
    Args:
        email (str): Email address
        name (str): Name associated with email
        source (str): Source of the email (popup, contact, order)
        user (User): Django user object if available
        increment_subscription (bool): Whether to increment subscription count
        increment_message (bool): Whether to increment message count
        increment_order (bool): Whether to increment order count
    """
    email = email.lower().strip()
    
    # Create or get email list entry
    email_entry, created = EmailList.objects.get_or_create(
        email=email,
        defaults={
            'name': name,
            'sources': [source] if source else [],
            'user': user,
            'subscription_count': 1 if increment_subscription else 0,
            'message_count': 1 if increment_message else 0,
            'order_count': 1 if increment_order else 0,
            'is_active': True
        }
    )
    
    if not created:
        # Update existing entry
        updated = False
        
        # Update name if not set and we have one
        if name and not email_entry.name:
            email_entry.name = name
            updated = True
        
        # Update user if not set and we have one
        if user and not email_entry.user:
            email_entry.user = user
            updated = True
        
        # Add source if not already present
        if source and source not in email_entry.sources:
            email_entry.sources.append(source)
            updated = True
        
        # Increment counters
        if increment_subscription:
            email_entry.subscription_count += 1
            updated = True
        
        if increment_message:
            email_entry.message_count += 1
            updated = True
        
        if increment_order:
            email_entry.order_count += 1
            updated = True
        
        if updated:
            email_entry.save()
    
    return email_entry

def sync_order_emails():
    """
    Sync existing order emails to the consolidated email list
    This is a one-time function to populate the list with existing data
    """
    from orders.models import Order
    
    orders = Order.objects.all()
    synced_count = 0
    
    for order in orders:
        if order.email:
            name = f"{order.first_name} {order.last_name}".strip()
            user = order.user
            
            add_to_email_list(
                email=order.email,
                name=name,
                source='order',
                user=user,
                increment_order=True
            )
            synced_count += 1
    
    return synced_count 