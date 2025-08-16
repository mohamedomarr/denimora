from django.db import models
from django.contrib.auth.models import User
from orders.models import Order


class BostaShipment(models.Model):
    """
    Model to track Bosta shipments and their status.
    Links orders with Bosta tracking information.
    """
    DELIVERY_TYPES = (
        (10, 'Package Delivery'),
        (20, 'Cash Collection (COD)'),
    )
    
    SHIPMENT_STATUS = (
        ('pending', 'Pending'),
        ('pickup_requested', 'Pickup Requested'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
        ('exception', 'Exception'),
    )

    # Core relationship
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='bosta_shipment')
    
    # Bosta tracking information
    bosta_tracking_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    bosta_delivery_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    # Shipment details
    delivery_type = models.IntegerField(choices=DELIVERY_TYPES, default=20)  # Default to COD
    status = models.CharField(max_length=20, choices=SHIPMENT_STATUS, default='pending')
    
    # Bosta API response data
    bosta_response_data = models.JSONField(null=True, blank=True, help_text="Full response from Bosta API")
    
    # Pickup information
    pickup_date = models.DateTimeField(null=True, blank=True)
    pickup_address = models.JSONField(null=True, blank=True, help_text="Pickup address details")
    
    # Delivery information
    delivery_date = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True)
    
    # COD information
    cod_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cod_collected = models.BooleanField(default=False)
    cod_collection_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ('-created',)
        verbose_name = "Bosta Shipment"
        verbose_name_plural = "Bosta Shipments"

    def __str__(self):
        return f"Shipment for Order #{self.order.id} - {self.bosta_tracking_number or 'No tracking'}"

    def is_cod_shipment(self):
        """Check if this is a cash-on-delivery shipment"""
        return self.delivery_type == 20

    def get_status_display_class(self):
        """Return CSS class for status display"""
        status_classes = {
            'pending': 'warning',
            'pickup_requested': 'info',
            'picked_up': 'info',
            'in_transit': 'primary',
            'delivered': 'success',
            'returned': 'danger',
            'cancelled': 'secondary',
            'exception': 'danger',
        }
        return status_classes.get(self.status, 'secondary')


class BostaTrackingEvent(models.Model):
    """
    Model to store tracking events/history for each shipment.
    Updated via Bosta webhooks.
    """
    EVENT_TYPES = (
        ('created', 'Shipment Created'),
        ('pickup_requested', 'Pickup Requested'),
        ('picked_up', 'Package Picked Up'),
        ('in_transit', 'In Transit'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('delivery_failed', 'Delivery Failed'),
        ('returned_to_sender', 'Returned to Sender'),
        ('cancelled', 'Cancelled'),
        ('exception', 'Exception Occurred'),
    )

    shipment = models.ForeignKey(BostaShipment, on_delete=models.CASCADE, related_name='tracking_events')
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    event_description = models.TextField()
    event_location = models.CharField(max_length=200, blank=True)
    event_timestamp = models.DateTimeField()
    
    # Raw webhook data
    webhook_data = models.JSONField(null=True, blank=True)
    
    # System tracking
    created = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ('-event_timestamp',)
        verbose_name = "Tracking Event"
        verbose_name_plural = "Tracking Events"

    def __str__(self):
        return f"{self.shipment.bosta_tracking_number} - {self.get_event_type_display()}"


class BostaSettings(models.Model):
    """
    Store Bosta API configuration and settings.
    """
    ENVIRONMENT_CHOICES = (
        ('staging', 'Staging'),
        ('production', 'Production'),
    )

    # API Configuration
    api_key = models.CharField(max_length=255, help_text="Bosta API Key")
    api_base_url = models.URLField(
        default="https://app.bosta.co",
        help_text="Bosta API Base URL (staging: https://stg-app.bosta.co)"
    )
    environment = models.CharField(max_length=20, choices=ENVIRONMENT_CHOICES, default='staging')
    
    # Pickup Configuration
    business_reference = models.CharField(max_length=100, blank=True, help_text="Your business reference for Bosta")
    default_pickup_address = models.JSONField(
        null=True, blank=True,
        help_text="Default pickup address for your business"
    )
    
    # Webhook Configuration
    webhook_secret = models.CharField(max_length=255, blank=True, help_text="Secret for webhook validation")
    webhook_url = models.URLField(blank=True, help_text="Your webhook URL for Bosta notifications")
    
    # Operational Settings
    auto_create_shipments = models.BooleanField(
        default=False,
        help_text="Automatically create Bosta shipments for new orders"
    )
    auto_request_pickup = models.BooleanField(
        default=False,
        help_text="Automatically request pickup when shipments are created"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Bosta Settings"
        verbose_name_plural = "Bosta Settings"

    def __str__(self):
        return f"Bosta Settings - {self.get_environment_display()}"

    @classmethod
    def get_active_settings(cls):
        """Get the active Bosta settings instance"""
        return cls.objects.filter(is_active=True).first()

    def save(self, *args, **kwargs):
        # Ensure only one active settings instance
        if self.is_active:
            BostaSettings.objects.filter(is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class BostaPickupRequest(models.Model):
    """
    Model to track pickup requests to Bosta.
    Multiple shipments can be part of one pickup request.
    """
    PICKUP_STATUS = (
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    TIME_SLOTS = (
        ('10:00 to 13:00', '10:00 to 13:00'),
        ('13:00 to 16:00', '13:00 to 16:00'),
    )

    # Bosta pickup information
    bosta_pickup_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    # Pickup details
    scheduled_date = models.DateField()
    scheduled_time_slot = models.CharField(max_length=20, choices=TIME_SLOTS)
    pickup_address = models.JSONField(help_text="Address where packages will be picked up")
    
    # Contact information
    contact_name = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=20)
    contact_email = models.EmailField(blank=True)
    
    # Status and notes
    status = models.CharField(max_length=20, choices=PICKUP_STATUS, default='pending')
    notes = models.TextField(blank=True)
    number_of_packages = models.PositiveIntegerField(default=0)
    
    # Response data
    bosta_response_data = models.JSONField(null=True, blank=True)
    
    # Timestamps
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-created',)
        verbose_name = "Pickup Request"
        verbose_name_plural = "Pickup Requests"

    def __str__(self):
        return f"Pickup {self.bosta_pickup_id or 'Pending'} - {self.scheduled_date}"

    def get_shipments(self):
        """Get all shipments associated with this pickup"""
        return BostaShipment.objects.filter(pickup_request=self)


# Add pickup_request field to BostaShipment to link shipments with pickup requests
BostaShipment.add_to_class(
    'pickup_request',
    models.ForeignKey(
        BostaPickupRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments'
    )
) 