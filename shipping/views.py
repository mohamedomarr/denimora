import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from orders.models import Order
from .models import BostaShipment, BostaTrackingEvent, BostaSettings
from .services import BostaService, BostaOrderIntegration, BostaAPIError

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def bosta_webhook(request):
    """
    Handle webhooks from Bosta for shipment status updates.
    """
    try:
        # Parse webhook payload
        webhook_data = json.loads(request.body)
        
        # Log webhook for debugging (remove in production)
        logger.info(f"Received Bosta webhook: {webhook_data}")
        
        # Validate webhook if secret is configured
        settings = BostaSettings.get_active_settings()
        if settings and settings.webhook_secret:
            # Add webhook signature validation here if Bosta supports it
            pass
        
        # Process the webhook
        bosta_service = BostaService()
        success = bosta_service.handle_webhook(webhook_data)
        
        if success:
            return HttpResponse("OK", status=200)
        else:
            return HttpResponse("Failed to process webhook", status=400)
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON in webhook payload")
        return HttpResponse("Invalid JSON", status=400)
    except Exception as e:
        logger.error(f"Error processing Bosta webhook: {str(e)}")
        return HttpResponse("Internal server error", status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_tracking_info(request, tracking_number):
    """
    Get tracking information for a shipment.
    """
    try:
        # Get shipment from database
        try:
            shipment = BostaShipment.objects.get(bosta_tracking_number=tracking_number)
        except BostaShipment.DoesNotExist:
            return Response({'error': 'Tracking number not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get tracking events
        tracking_events = shipment.tracking_events.all()
        
        # Format response
        tracking_data = {
            'tracking_number': tracking_number,
            'status': shipment.get_status_display(),
            'delivery_type': shipment.get_delivery_type_display(),
            'order_id': shipment.order.id,
            'created_date': shipment.created.isoformat(),
            'pickup_date': shipment.pickup_date.isoformat() if shipment.pickup_date else None,
            'delivery_date': shipment.delivery_date.isoformat() if shipment.delivery_date else None,
            'events': [
                {
                    'type': event.get_event_type_display(),
                    'description': event.event_description,
                    'location': event.event_location,
                    'timestamp': event.event_timestamp.isoformat(),
                }
                for event in tracking_events
            ]
        }
        
        # Add COD information if applicable
        if shipment.is_cod_shipment():
            tracking_data['cod'] = {
                'amount': float(shipment.cod_amount) if shipment.cod_amount else 0,
                'collected': shipment.cod_collected,
                'collection_date': shipment.cod_collection_date.isoformat() if shipment.cod_collection_date else None,
            }
        
        return Response(tracking_data)
        
    except Exception as e:
        logger.error(f"Error getting tracking info for {tracking_number}: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_shipments(request):
    """
    List shipments for the authenticated user.
    """
    try:
        # Get user's orders with shipments
        user_shipments = BostaShipment.objects.filter(
            order__user=request.user
        ).select_related('order').order_by('-created')
        
        shipments_data = []
        for shipment in user_shipments:
            shipments_data.append({
                'order_id': shipment.order.id,
                'tracking_number': shipment.bosta_tracking_number,
                'status': shipment.get_status_display(),
                'delivery_type': shipment.get_delivery_type_display(),
                'created_date': shipment.created.isoformat(),
                'delivery_date': shipment.delivery_date.isoformat() if shipment.delivery_date else None,
            })
        
        return Response({'shipments': shipments_data})
        
    except Exception as e:
        logger.error(f"Error listing shipments for user {request.user.id}: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shipment(request, order_id):
    """
    Create a Bosta shipment for an order.
    """
    try:
        # Get the order
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Check if shipment already exists
        if hasattr(order, 'bosta_shipment'):
            return Response({
                'error': 'Shipment already exists for this order',
                'tracking_number': order.bosta_shipment.bosta_tracking_number
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create shipment
        integration = BostaOrderIntegration()
        shipment = integration.create_shipment_for_order(order)
        
        if shipment:
            return Response({
                'message': 'Shipment created successfully',
                'tracking_number': shipment.bosta_tracking_number,
                'order_id': order.id
            })
        else:
            return Response({
                'error': 'Failed to create shipment'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error creating shipment for order {order_id}: {str(e)}")
        return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@staff_member_required
@require_http_methods(["GET"])
def sync_all_tracking(request):
    """
    Admin tool to sync tracking information for all active shipments.
    """
    try:
        bosta_service = BostaService()
        
        # Get all shipments with tracking numbers that are not delivered
        active_shipments = BostaShipment.objects.filter(
            bosta_tracking_number__isnull=False,
            status__in=['pickup_requested', 'picked_up', 'in_transit']
        )
        
        updated_count = 0
        for shipment in active_shipments:
            try:
                result = bosta_service.track_shipment(shipment.bosta_tracking_number)
                if result:
                    updated_count += 1
            except Exception as e:
                logger.error(f"Error syncing tracking for {shipment.bosta_tracking_number}: {str(e)}")
        
        return JsonResponse({
            'message': f'Synced tracking for {updated_count} out of {active_shipments.count()} shipments',
            'updated_count': updated_count,
            'total_shipments': active_shipments.count()
        })
        
    except Exception as e:
        logger.error(f"Error in sync_all_tracking: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


@staff_member_required
@require_http_methods(["GET"])
def test_bosta_connection(request):
    """
    Admin tool to test Bosta API connection and configuration.
    """
    try:
        # Check if settings are configured
        settings = BostaSettings.get_active_settings()
        if not settings:
            return JsonResponse({
                'status': 'error',
                'message': 'No active Bosta settings found'
            }, status=400)
        
        # Test API connection
        bosta_service = BostaService()
        cities = bosta_service.get_cities()
        
        if cities:
            return JsonResponse({
                'status': 'success',
                'message': 'Bosta API connection successful',
                'api_url': settings.api_base_url,
                'environment': settings.get_environment_display(),
                'cities_count': len(cities),
                'settings': {
                    'auto_create_shipments': settings.auto_create_shipments,
                    'auto_request_pickup': settings.auto_request_pickup,
                    'webhook_configured': bool(settings.webhook_url),
                }
            })
        else:
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to fetch cities from Bosta API'
            }, status=500)
            
    except BostaAPIError as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Bosta API Error: {str(e)}'
        }, status=500)
    except Exception as e:
        logger.error(f"Error testing Bosta connection: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': f'Internal server error: {str(e)}'
        }, status=500)


class TrackingPageView(View):
    """
    View for public tracking page.
    """
    template_name = 'shipping/tracking.html'
    
    def get(self, request, tracking_number=None):
        from django.shortcuts import render
        
        context = {
            'tracking_number': tracking_number,
        }
        
        if tracking_number:
            try:
                shipment = BostaShipment.objects.get(bosta_tracking_number=tracking_number)
                tracking_events = shipment.tracking_events.all()
                
                context.update({
                    'shipment': shipment,
                    'tracking_events': tracking_events,
                    'order': shipment.order,
                })
            except BostaShipment.DoesNotExist:
                context['error'] = 'Tracking number not found'
        
        return render(request, self.template_name, context)


# Add URL pattern for tracking page
tracking_page = TrackingPageView.as_view() 