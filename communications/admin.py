from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponse
import csv
from datetime import datetime
from .models import EmailSubscription, ContactMessage, EmailList

@admin.register(EmailSubscription)
class EmailSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['email', 'source', 'is_active', 'subscribed_at', 'user_link']
    list_filter = ['source', 'is_active', 'subscribed_at']
    search_fields = ['email', 'user__username', 'user__first_name', 'user__last_name']
    date_hierarchy = 'subscribed_at'
    readonly_fields = ['subscribed_at', 'unsubscribed_at']
    actions = ['export_to_csv', 'activate_subscriptions', 'deactivate_subscriptions']
    
    fieldsets = (
        ('Subscription Information', {
            'fields': ('email', 'source', 'user', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('subscribed_at', 'unsubscribed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:auth_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return "-"
    user_link.short_description = "User"
    
    def export_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="email_subscriptions_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Email', 'Source', 'Status', 'Subscribed Date', 'User'])
        
        for subscription in queryset:
            writer.writerow([
                subscription.email,
                subscription.get_source_display(),
                'Active' if subscription.is_active else 'Inactive',
                subscription.subscribed_at.strftime('%Y-%m-%d %H:%M:%S'),
                subscription.user.username if subscription.user else ''
            ])
        
        return response
    export_to_csv.short_description = "Export selected subscriptions to CSV"
    
    def activate_subscriptions(self, request, queryset):
        updated = queryset.update(is_active=True, unsubscribed_at=None)
        self.message_user(request, f'{updated} subscriptions activated.')
    activate_subscriptions.short_description = "Activate selected subscriptions"
    
    def deactivate_subscriptions(self, request, queryset):
        updated = queryset.update(is_active=False, unsubscribed_at=datetime.now())
        self.message_user(request, f'{updated} subscriptions deactivated.')
    deactivate_subscriptions.short_description = "Deactivate selected subscriptions"

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'status', 'submitted_at', 'message_preview', 'user_link']
    list_filter = ['status', 'submitted_at']
    search_fields = ['name', 'email', 'message', 'user__username']
    date_hierarchy = 'submitted_at'
    readonly_fields = ['submitted_at', 'updated_at']
    list_editable = ['status']
    actions = ['mark_as_read', 'mark_as_replied', 'archive_messages', 'export_to_csv']
    
    fieldsets = (
        ('Message Information', {
            'fields': ('name', 'email', 'user', 'message')
        }),
        ('Status & Notes', {
            'fields': ('status', 'admin_notes')
        }),
        ('Timestamps', {
            'fields': ('submitted_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = "Message Preview"
    
    def user_link(self, obj):
        if obj.user:
            url = reverse('admin:auth_user_change', args=[obj.user.id])
            return format_html('<a href="{}">{}</a>', url, obj.user.username)
        return "-"
    user_link.short_description = "User"
    
    def mark_as_read(self, request, queryset):
        updated = queryset.update(status='read')
        self.message_user(request, f'{updated} messages marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_replied(self, request, queryset):
        updated = queryset.update(status='replied')
        self.message_user(request, f'{updated} messages marked as replied.')
    mark_as_replied.short_description = "Mark selected messages as replied"
    
    def archive_messages(self, request, queryset):
        updated = queryset.update(status='archived')
        self.message_user(request, f'{updated} messages archived.')
    archive_messages.short_description = "Archive selected messages"
    
    def export_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="contact_messages_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Email', 'Message', 'Status', 'Submitted Date', 'User', 'Admin Notes'])
        
        for message in queryset:
            writer.writerow([
                message.name,
                message.email,
                message.message,
                message.get_status_display(),
                message.submitted_at.strftime('%Y-%m-%d %H:%M:%S'),
                message.user.username if message.user else '',
                message.admin_notes
            ])
        
        return response
    export_to_csv.short_description = "Export selected messages to CSV"

@admin.register(EmailList)
class EmailListAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'sources_display', 'subscription_count', 'message_count', 'order_count', 'is_active', 'last_activity']
    list_filter = ['is_active', 'subscription_count', 'message_count', 'order_count', 'first_seen']
    search_fields = ['email', 'name', 'user__username']
    readonly_fields = ['first_seen', 'last_activity', 'sources_display']
    list_editable = ['is_active']
    actions = ['export_to_csv', 'activate_emails', 'deactivate_emails']
    
    fieldsets = (
        ('Email Information', {
            'fields': ('email', 'name', 'user', 'is_active')
        }),
        ('Activity Statistics', {
            'fields': ('subscription_count', 'message_count', 'order_count', 'sources_display')
        }),
        ('Timestamps', {
            'fields': ('first_seen', 'last_activity'),
            'classes': ('collapse',)
        }),
    )
    
    def sources_display(self, obj):
        return obj.get_sources_display()
    sources_display.short_description = "Sources"
    
    def activate_emails(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} email entries activated.')
    activate_emails.short_description = "Activate selected email entries"
    
    def deactivate_emails(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} email entries deactivated.')
    deactivate_emails.short_description = "Deactivate selected email entries"
    
    def export_to_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="email_list_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Email', 'Name', 'Sources', 'Subscriptions', 'Messages', 'Orders', 'Status', 'First Seen', 'Last Activity'])
        
        for email_entry in queryset:
            writer.writerow([
                email_entry.email,
                email_entry.name,
                email_entry.get_sources_display(),
                email_entry.subscription_count,
                email_entry.message_count,
                email_entry.order_count,
                'Active' if email_entry.is_active else 'Inactive',
                email_entry.first_seen.strftime('%Y-%m-%d %H:%M:%S'),
                email_entry.last_activity.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_to_csv.short_description = "Export selected emails to CSV"
