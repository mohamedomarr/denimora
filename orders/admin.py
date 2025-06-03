from django.contrib import admin
from django.http import HttpResponse
from django.template.loader import get_template
from django.urls import reverse
from django.utils.html import format_html
from .models import Order, OrderItem, GovernorateShipping

@admin.register(GovernorateShipping)
class GovernorateShippingAdmin(admin.ModelAdmin):
    list_display = ['name', 'shipping_cost', 'is_active', 'created', 'updated']
    list_filter = ['is_active', 'created', 'updated']
    search_fields = ['name']
    list_editable = ['shipping_cost', 'is_active']
    ordering = ['name']
    readonly_fields = ['created', 'updated']
    
    fieldsets = (
        ('Governorate Information', {
            'fields': ('name', 'shipping_cost', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created', 'updated'),
            'classes': ('collapse',)
        }),
    )

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ['product']
    readonly_fields = ['size_name', 'size_id', 'item_total']
    fields = ['product', 'price', 'quantity', 'size_name', 'size_id', 'item_total']
    extra = 0
    
    def item_total(self, obj):
        """Display the total cost for this item (price × quantity)"""
        if obj.id:
            return f"{obj.get_cost()} LE"
        return "-"
    item_total.short_description = "Item Total"

def print_receipt(modeladmin, request, queryset):
    """Admin action to print order receipt"""
    if queryset.count() != 1:
        modeladmin.message_user(request, "Please select exactly one order to print.", level='ERROR')
        return
    
    order = queryset.first()
    template = get_template('admin/orders/order_receipt.html')
    html = template.render({'order': order})
    
    response = HttpResponse(html, content_type='text/html')
    response['Content-Disposition'] = f'inline; filename="order_{order.id}_receipt.html"'
    return response

print_receipt.short_description = "Print receipt for selected order"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'first_name', 'last_name', 'email',
                    'address', 'city', 'governorate', 'paid', 'status', 'items_total', 'shipping_cost', 'total_with_shipping', 'created', 'updated']
    list_filter = ['paid', 'status', 'governorate', 'created', 'updated']
    search_fields = ['first_name', 'last_name', 'email', 'address', 'governorate']
    inlines = [OrderItemInline]
    list_editable = ['status', 'paid']
    date_hierarchy = 'created'
    ordering = ['-created']
    actions = [print_receipt]
    readonly_fields = ['created', 'updated', 'items_total', 'shipping_cost', 'total_with_shipping', 'receipt_link']
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('user', 'first_name', 'last_name', 'email', 'phone')
        }),
        ('Shipping Address', {
            'fields': ('address', 'city', 'governorate', 'postal_code')
        }),
        ('Order Details', {
            'fields': ('status', 'paid')
        }),
        ('Timestamps', {
            'fields': ('created', 'updated'),
            'classes': ('collapse',)
        }),
        ('Order Totals', {
            'fields': ('items_total', 'shipping_cost', 'total_with_shipping', 'receipt_link'),
            'classes': ('collapse',)
        }),
    )
    
    def items_total(self, obj):
        """Display the total cost of all items (subtotal)"""
        return f"{obj.get_total_cost()} LE"
    items_total.short_description = "Items Total"
    
    def shipping_cost(self, obj):
        """Display the shipping cost based on governorate"""
        cost = obj.get_shipping_cost()
        governorate_info = f" ({obj.governorate})" if obj.governorate else " (Default)"
        return f"{cost} LE{governorate_info}"
    shipping_cost.short_description = "Shipping Cost"
    
    def total_with_shipping(self, obj):
        """Display the total cost including shipping"""
        return f"{obj.get_total_cost_with_shipping()} LE"
    total_with_shipping.short_description = "Total (with Shipping)"
    
    def receipt_link(self, obj):
        """Display a link to print the receipt"""
        if obj.id:
            url = reverse('orders:print_receipt', args=[obj.id])
            return format_html(
                '<a href="{}" target="_blank" '
                'style="background: #417690; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">'
                'Print Receipt</a>',
                url
            )
        return "-"
    receipt_link.short_description = "Receipt"
    receipt_link.allow_tags = True
