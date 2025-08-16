from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from orders.models import Order
from .models import BostaShipment, BostaSettings
from .services import BostaOrderIntegration
import logging
from django.db import transaction

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Order)
def create_shipment_for_order(sender, instance, created, **kwargs):
    """
    Automatically create a Bosta shipment when an order is created.
    Only if auto_create_shipments is enabled in settings.
    """
    if created:
        try:
            settings = BostaSettings.get_active_settings()
            if settings and settings.auto_create_shipments:
                # Defer shipment creation until after the surrounding transaction commits,
                # so that order items are saved and totals are accurate (avoids COD=100 fallback).
                order_id = instance.id

                def _create_after_commit():
                    try:
                        order = Order.objects.get(id=order_id)
                        integration = BostaOrderIntegration()
                        shipment = integration.create_shipment_for_order(order)
                        if shipment:
                            logger.info(f"Auto-created Bosta shipment for Order #{order.id}")
                    except Exception as inner_e:
                        logger.error(f"Error auto-creating shipment post-commit for Order #{order_id}: {str(inner_e)}")

                transaction.on_commit(_create_after_commit)
        except Exception as e:
            logger.error(f"Error scheduling auto-creation for Order #{instance.id}: {str(e)}")


@receiver(pre_save, sender=Order)
def sync_order_status_with_shipment(sender, instance, **kwargs):
    """
    Keep order status in sync with Bosta shipment status.
    """
    if instance.pk:  # Only for existing orders
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Order status changed, check if we need to update shipment
                if hasattr(instance, 'bosta_shipment'):
                    shipment = instance.bosta_shipment
                    
                    # Update shipment status based on order status changes
                    if instance.status == 'cancelled' and shipment.status not in ['delivered', 'cancelled']:
                        # Cancel shipment in Bosta if order is cancelled
                        from .services import BostaService
                        bosta_service = BostaService()
                        if shipment.bosta_delivery_id:
                            bosta_service.cancel_shipment(shipment.bosta_delivery_id)
                
        except Order.DoesNotExist:
            pass  # New order
        except Exception as e:
            logger.error(f"Error syncing order status for Order #{instance.id}: {str(e)}")


@receiver(post_save, sender=BostaShipment)
def update_order_status_from_shipment(sender, instance, **kwargs):
    """
    Update order status when shipment status changes.
    """
    try:
        order = instance.order
        
        # Map shipment status to order status
        if instance.status == 'delivered' and order.status != 'delivered':
            order.status = 'delivered'
            # Disconnect signal temporarily to avoid recursion
            post_save.disconnect(sync_order_status_with_shipment, sender=Order)
            order.save()
            post_save.connect(sync_order_status_with_shipment, sender=Order)
            
        elif instance.status == 'in_transit' and order.status == 'pending':
            order.status = 'shipped'
            post_save.disconnect(sync_order_status_with_shipment, sender=Order)
            order.save()
            post_save.connect(sync_order_status_with_shipment, sender=Order)
            
    except Exception as e:
        logger.error(f"Error updating order status from shipment {instance.id}: {str(e)}") 