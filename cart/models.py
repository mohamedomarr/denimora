from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from products.models import Product, Size


class CartReservation(models.Model):
    """
    Temporary inventory reservation for cart items.
    Prevents overselling by reserving stock when items are added to cart.
    Expires after 5 minutes to prevent inventory blocking.
    """
    session_id = models.CharField(max_length=255, db_index=True)  # For anonymous users
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )  # For logged-in users
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    size = models.ForeignKey(Size, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['session_id', 'product', 'size']
        indexes = [
            models.Index(fields=['expires_at', 'is_active']),
            models.Index(fields=['session_id', 'is_active']),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Set expiration to 5 minutes from now (aggressive reservation)
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def extend_expiry(self, minutes=5):
        """Extend the reservation expiry time (default 5 minutes)"""
        self.expires_at = timezone.now() + timedelta(minutes=minutes)
        self.save()

    def __str__(self):
        size_info = f" - {self.size.name}" if self.size else ""
        return f"{self.product.name}{size_info} (x{self.quantity}) - Expires: {self.expires_at}"
