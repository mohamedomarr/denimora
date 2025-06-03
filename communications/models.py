from django.db import models
from django.core.validators import EmailValidator
from django.contrib.auth.models import User

class EmailSubscription(models.Model):
    """
    Model to store email subscriptions from the popup and other sources
    """
    email = models.EmailField(
        unique=True, 
        validators=[EmailValidator()],
        help_text="Subscriber's email address"
    )
    source = models.CharField(
        max_length=50,
        choices=[
            ('popup', 'Newsletter Popup'),
            ('order', 'From Order'),
            ('footer', 'Footer Form'),
            ('manual', 'Manually Added'),
        ],
        default='popup',
        help_text="Source of the subscription"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the subscription is active"
    )
    subscribed_at = models.DateTimeField(auto_now_add=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    
    # Optional: Link to user if they're registered
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='email_subscriptions'
    )
    
    class Meta:
        ordering = ['-subscribed_at']
        verbose_name = "Email Subscription"
        verbose_name_plural = "Email Subscriptions"
    
    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.email} ({self.get_source_display()}) - {status}"

class ContactMessage(models.Model):
    """
    Model to store messages from the contact form
    """
    name = models.CharField(max_length=100, help_text="Sender's name")
    email = models.EmailField(
        validators=[EmailValidator()],
        help_text="Sender's email address"
    )
    message = models.TextField(help_text="Message content")
    
    # Status tracking
    STATUS_CHOICES = [
        ('new', 'New'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='new',
        help_text="Message status"
    )
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional: Link to user if they're registered
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='contact_messages'
    )
    
    # Admin notes
    admin_notes = models.TextField(
        blank=True,
        help_text="Internal notes for admin use"
    )
    
    class Meta:
        ordering = ['-submitted_at']
        verbose_name = "Contact Message"
        verbose_name_plural = "Contact Messages"
    
    def __str__(self):
        return f"{self.name} ({self.email}) - {self.get_status_display()}"

class EmailList(models.Model):
    """
    Model to store consolidated email list from all sources including orders
    """
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()],
        help_text="Email address"
    )
    name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Name associated with email (if available)"
    )
    
    # Sources where this email appeared
    sources = models.JSONField(
        default=list,
        help_text="List of sources where this email was collected"
    )
    
    # Counts
    subscription_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times subscribed"
    )
    message_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of messages sent"
    )
    order_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of orders placed"
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether email is active for communications"
    )
    
    # Timestamps
    first_seen = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    # Optional: Link to user if they're registered
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_records'
    )
    
    class Meta:
        ordering = ['-last_activity']
        verbose_name = "Email List Entry"
        verbose_name_plural = "Email List"
    
    def __str__(self):
        name_part = f" ({self.name})" if self.name else ""
        return f"{self.email}{name_part} - {len(self.sources)} sources"
    
    def add_source(self, source):
        """Add a source to the sources list if not already present"""
        if source not in self.sources:
            self.sources.append(source)
            self.save()
    
    def get_sources_display(self):
        """Return a readable string of all sources"""
        return ", ".join(self.sources) if self.sources else "None"
