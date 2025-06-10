from django.db import models
from django.contrib.auth.models import User
from products.models import Product

# Default shipping fee constant (fallback)
DEFAULT_SHIPPING_FEE = 100

class GovernorateShipping(models.Model):
    """
    Model to define shipping costs for different governorates.
    Allows admin to set custom shipping fees per governorate.
    """
    name = models.CharField(max_length=50, unique=True, help_text="Governorate name")
    shipping_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        help_text="Shipping cost for this governorate in LE"
    )
    is_active = models.BooleanField(default=True, help_text="Whether this governorate is available for shipping")
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('name',)
        verbose_name = "Governorate Shipping"
        verbose_name_plural = "Governorate Shipping Rates"

    def __str__(self):
        return f"{self.name} - {self.shipping_cost} LE"

    @classmethod
    def get_shipping_cost(cls, governorate_name):
        """
        Get shipping cost for a governorate.
        Returns default fee if governorate not found or inactive.
        """
        if not governorate_name:
            return DEFAULT_SHIPPING_FEE
        
        try:
            gov_shipping = cls.objects.get(name__iexact=governorate_name, is_active=True)
            return gov_shipping.shipping_cost
        except cls.DoesNotExist:
            return DEFAULT_SHIPPING_FEE

class Order(models.Model):
    """
    Order model representing a customer's purchase.
    
    Now includes methods to calculate:
    - Item subtotal (get_total_cost)
    - Dynamic shipping cost based on governorate (get_shipping_cost)
    - Total with shipping (get_total_cost_with_shipping)
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    address = models.CharField(max_length=250)
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    # Add governorate field to store the selected governorate
    governorate = models.CharField(max_length=50, blank=True, null=True, help_text="Customer's governorate for shipping calculation")
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    paid = models.BooleanField(default=False)

    class Meta:
        ordering = ('-created',)

    def __str__(self):
        return f'Order {self.id}'

    def get_total_cost(self):
        """Calculate subtotal of all order items"""
        return sum(item.get_cost() for item in self.items.all())

    def get_shipping_cost(self):
        """
        Return shipping cost based on governorate.
        Uses GovernorateShipping model or defaults to DEFAULT_SHIPPING_FEE.
        """
        return GovernorateShipping.get_shipping_cost(self.governorate)
    
    def get_total_cost_with_shipping(self):
        """Return total cost including shipping"""
        return self.get_total_cost() + self.get_shipping_cost()
    
    def save(self, *args, **kwargs):
        """
        Override save method to send emails on order status updates only.
        Confirmation email should be sent after all OrderItems are created (in the order creation logic, not here).
        """
        is_new = self.pk is None
        if not is_new:
            old_instance = Order.objects.get(pk=self.pk)
            status_changed = old_instance.status != self.status
        else:
            status_changed = False

        # Save the order
        super().save(*args, **kwargs)

        # Send status update email only (not confirmation email)
        try:
            from .utils import send_order_status_update_email
            # Send status update email when status changes
            if not is_new and status_changed:
                print(f"Attempting to send status update email to {self.email} for order #{self.id}")
                send_order_status_update_email(self)
                print("Status update email sent successfully")
        except Exception as e:
            # Log the error but don't prevent the order from being saved
            print(f"Error sending order email: {str(e)}")
            import traceback
            print(traceback.format_exc())


class OrderItem(models.Model):
    """
    Individual item within an order.
    
    Now displays total cost in string representation for better admin visibility.
    """
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.CASCADE, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    size_name = models.CharField(max_length=20, blank=True, null=True)
    size_id = models.PositiveIntegerField(blank=True, null=True)

    def __str__(self):
        size_info = f" - Size: {self.size_name}" if self.size_name else ""
        product_name = self.product.name if self.product else "Custom Item"
        total_cost = self.get_cost()
        return f"{product_name}{size_info} (x{self.quantity}) - {total_cost} LE"

    def get_cost(self):
        """Calculate total cost for this item (price × quantity)"""
        return self.price * self.quantity
