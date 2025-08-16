from django.core.management.base import BaseCommand
from django.db import transaction
from orders.models import Order
from shipping.models import BostaShipment
from shipping.services import BostaOrderIntegration
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create Bosta shipments for existing orders that don\'t have shipments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--order-id',
            type=int,
            help='Create shipment for specific order ID only'
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
            help='Only process orders with this status'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=100,
            help='Maximum number of orders to process (default: 100)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually creating shipments'
        )
        parser.add_argument(
            '--auto-create',
            action='store_true',
            help='Also create shipments in Bosta API (not just database records)'
        )

    def handle(self, *args, **options):
        try:
            integration = BostaOrderIntegration()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to initialize Bosta integration: {str(e)}')
            )
            return

        # Handle specific order
        if options['order_id']:
            try:
                order = Order.objects.get(id=options['order_id'])
                self.process_order(integration, order, options)
                return
            except Order.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Order with ID {options["order_id"]} not found')
                )
                return

        # Get orders without shipments
        queryset = Order.objects.filter(
            bosta_shipment__isnull=True
        ).select_related('user')

        if options['status']:
            queryset = queryset.filter(status=options['status'])

        # Order by creation date (oldest first)
        orders = queryset.order_by('created')[:options['limit']]
        total_count = orders.count()

        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No orders found that need shipments'))
            return

        self.stdout.write(f'Found {total_count} orders without Bosta shipments')

        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No shipments will be created'))
            for order in orders:
                self.stdout.write(f'Would create shipment for Order #{order.id} ({order.email})')
            return

        created_count = 0
        error_count = 0

        for i, order in enumerate(orders, 1):
            self.stdout.write(f'Processing {i}/{total_count}: Order #{order.id}')
            
            try:
                success = self.process_order(integration, order, options)
                if success:
                    created_count += 1
                else:
                    error_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Error processing Order #{order.id}: {str(e)}')
                )
                error_count += 1

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'Processing complete: {created_count} created, {error_count} errors, {total_count} total'
            )
        )

    def process_order(self, integration, order, options):
        """
        Process a single order and return success status.
        """
        try:
            # Check if shipment already exists
            if hasattr(order, 'bosta_shipment'):
                self.stdout.write(
                    self.style.WARNING(f'  Shipment already exists for Order #{order.id}')
                )
                return False

            with transaction.atomic():
                # Create shipment record
                shipment = BostaShipment.objects.create(
                    order=order,
                    delivery_type=20 if not order.paid else 10,  # COD if not paid
                    cod_amount=order.get_total_cost_with_shipping() if not order.paid else None,
                    status='pending'
                )

                self.stdout.write(
                    self.style.SUCCESS(f'  Created shipment record for Order #{order.id}')
                )

                # Create in Bosta API if requested
                if options['auto_create']:
                    try:
                        result = integration.bosta_service.create_shipment(shipment)
                        if result:
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'  Created Bosta shipment: {shipment.bosta_tracking_number}'
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.WARNING(f'  Failed to create in Bosta API')
                            )
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f'  Bosta API error: {str(e)}')
                        )

                return True

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  Database error: {str(e)}')
            )
            return False 