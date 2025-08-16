from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import BostaShipment, BostaTrackingEvent, BostaSettings, BostaPickupRequest


@admin.register(BostaSettings)
class BostaSettingsAdmin(admin.ModelAdmin):
    list_display = ('environment', 'is_active', 'auto_create_shipments', 'auto_request_pickup', 'updated')
    list_filter = ('environment', 'is_active', 'auto_create_shipments')
    fieldsets = (
        ('API Configuration', {
            'fields': ('api_key', 'api_base_url', 'environment', 'is_active')
        }),
        ('Business Settings', {
            'fields': ('business_reference', 'default_pickup_address')
        }),
        ('Webhook Configuration', {
            'fields': ('webhook_url', 'webhook_secret')
        }),
        ('Automation Settings', {
            'fields': ('auto_create_shipments', 'auto_request_pickup')
        }),
    )
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of active settings
        if obj and obj.is_active:
            return False
        return super().has_delete_permission(request, obj)


class BostaTrackingEventInline(admin.TabularInline):
    model = BostaTrackingEvent
    extra = 0
    readonly_fields = ('event_type', 'event_description', 'event_location', 'event_timestamp', 'created')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(BostaShipment)
class BostaShipmentAdmin(admin.ModelAdmin):
    list_display = (
        'order_link', 'bosta_tracking_number', 'status_badge', 'delivery_type_display',
        'cod_amount', 'cod_collected', 'created'
    )
    list_filter = ('status', 'delivery_type', 'cod_collected', 'created')
    search_fields = ('bosta_tracking_number', 'bosta_delivery_id', 'order__id', 'order__email')
    readonly_fields = ('bosta_tracking_number', 'bosta_delivery_id', 'bosta_response_data', 'created', 'updated')
    inlines = [BostaTrackingEventInline]
    
    fieldsets = (
        ('Order Information', {
            'fields': ('order', 'delivery_type')
        }),
        ('Bosta Tracking', {
            'fields': ('bosta_tracking_number', 'bosta_delivery_id', 'status')
        }),
        ('Pickup Information', {
            'fields': ('pickup_request', 'pickup_date', 'pickup_address')
        }),
        ('Delivery Information', {
            'fields': ('delivery_date', 'delivery_notes')
        }),
        ('COD Information', {
            'fields': ('cod_amount', 'cod_collected', 'cod_collection_date'),
            'classes': ('collapse',)
        }),
        ('System Data', {
            'fields': ('bosta_response_data', 'created', 'updated'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['create_bosta_shipment', 'track_shipment', 'request_pickup']

    def order_link(self, obj):
        url = reverse('admin:orders_order_change', args=[obj.order.id])
        return format_html('<a href="{}">{}</a>', url, f"Order #{obj.order.id}")
    order_link.short_description = "Order"

    def status_badge(self, obj):
        css_class = obj.get_status_display_class()
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            css_class,
            obj.get_status_display()
        )
    status_badge.short_description = "Status"

    def delivery_type_display(self, obj):
        return obj.get_delivery_type_display()
    delivery_type_display.short_description = "Type"

    def create_bosta_shipment(self, request, queryset):
        """Action to create shipments in Bosta for selected orders"""
        from .services import BostaService
        
        created_count = 0
        for shipment in queryset.filter(bosta_tracking_number__isnull=True):
            try:
                bosta_service = BostaService()
                result = bosta_service.create_shipment(shipment)
                if result:
                    created_count += 1
            except Exception as e:
                self.message_user(request, f"Error creating shipment for Order #{shipment.order.id}: {str(e)}", level='ERROR')
        
        if created_count:
            self.message_user(request, f"Successfully created {created_count} shipments in Bosta.")
    
    create_bosta_shipment.short_description = "Create shipments in Bosta"

    def track_shipment(self, request, queryset):
        """Action to update tracking information from Bosta"""
        from .services import BostaService
        
        updated_count = 0
        for shipment in queryset.filter(bosta_tracking_number__isnull=False):
            try:
                bosta_service = BostaService()
                result = bosta_service.track_shipment(shipment.bosta_tracking_number)
                if result:
                    updated_count += 1
            except Exception as e:
                self.message_user(request, f"Error tracking shipment {shipment.bosta_tracking_number}: {str(e)}", level='ERROR')
        
        if updated_count:
            self.message_user(request, f"Successfully updated {updated_count} shipments.")
    
    track_shipment.short_description = "Update tracking from Bosta"

    def request_pickup(self, request, queryset):
        """Action to request pickup for selected shipments"""
        from .services import BostaService
        
        shipments_without_pickup = queryset.filter(pickup_request__isnull=True, bosta_tracking_number__isnull=False)
        if shipments_without_pickup.exists():
            try:
                bosta_service = BostaService()
                pickup_request = bosta_service.create_pickup_request(list(shipments_without_pickup))
                if pickup_request:
                    self.message_user(request, f"Successfully created pickup request for {shipments_without_pickup.count()} shipments.")
            except Exception as e:
                self.message_user(request, f"Error creating pickup request: {str(e)}", level='ERROR')
        else:
            self.message_user(request, "No eligible shipments for pickup request.", level='WARNING')
    
    request_pickup.short_description = "Request pickup for shipments"


@admin.register(BostaPickupRequest)
class BostaPickupRequestAdmin(admin.ModelAdmin):
    list_display = (
        'bosta_pickup_id', 'scheduled_date', 'scheduled_time_slot', 
        'status', 'number_of_packages', 'contact_name', 'created'
    )
    list_filter = ('status', 'scheduled_date', 'scheduled_time_slot')
    search_fields = ('bosta_pickup_id', 'contact_name', 'contact_phone')
    readonly_fields = ('bosta_pickup_id', 'bosta_response_data', 'created', 'updated')
    
    fieldsets = (
        ('Pickup Details', {
            'fields': ('bosta_pickup_id', 'scheduled_date', 'scheduled_time_slot', 'status')
        }),
        ('Address & Contact', {
            'fields': ('pickup_address', 'contact_name', 'contact_phone', 'contact_email')
        }),
        ('Package Information', {
            'fields': ('number_of_packages', 'notes')
        }),
        ('System Data', {
            'fields': ('bosta_response_data', 'created', 'updated'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('shipments')


@admin.register(BostaTrackingEvent)
class BostaTrackingEventAdmin(admin.ModelAdmin):
    list_display = ('shipment_tracking', 'event_type', 'event_description', 'event_timestamp', 'created')
    list_filter = ('event_type', 'event_timestamp')
    search_fields = ('shipment__bosta_tracking_number', 'event_description', 'event_location')
    readonly_fields = ('webhook_data', 'created')
    
    def shipment_tracking(self, obj):
        return obj.shipment.bosta_tracking_number or f"Order #{obj.shipment.order.id}"
    shipment_tracking.short_description = "Tracking Number"

    def has_add_permission(self, request):
        return False  # Events are created via webhooks only

    def has_change_permission(self, request, obj=None):
        return False  # Events should not be modified 