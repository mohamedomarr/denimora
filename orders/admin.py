from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    raw_id_fields = ['product']
    readonly_fields = ['size_name', 'size_id']
    fields = ['product', 'price', 'quantity', 'size_name', 'size_id']
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'first_name', 'last_name', 'email',
                    'address', 'city', 'paid', 'status', 'created', 'updated']
    list_filter = ['paid', 'status', 'created', 'updated']
    search_fields = ['first_name', 'last_name', 'email', 'address']
    inlines = [OrderItemInline]
    list_editable = ['status', 'paid']
    date_hierarchy = 'created'
    ordering = ['-created']
