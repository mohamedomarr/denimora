from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from shipping.models import BostaShipment
from shipping.services import BostaService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Sync tracking information for all active Bosta shipments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to look back for shipments to sync (default: 7)'
        )
        parser.add_argument(
            '--tracking-number',
            type=str,
            help='Sync specific tracking number only'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force sync even for delivered/cancelled shipments'
        )

    def handle(self, *args, **options):
        try:
            bosta_service = BostaService()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to initialize Bosta service: {str(e)}')
            )
            return

        # Handle specific tracking number
        if options['tracking_number']:
            try:
                shipment = BostaShipment.objects.get(
                    bosta_tracking_number=options['tracking_number']
                )
                self.sync_shipment(bosta_service, shipment)
                return
            except BostaShipment.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Shipment with tracking number {options["tracking_number"]} not found')
                )
                return

        # Get shipments to sync
        cutoff_date = timezone.now() - timedelta(days=options['days'])
        
        queryset = BostaShipment.objects.filter(
            bosta_tracking_number__isnull=False,
            created__gte=cutoff_date
        )

        if not options['force']:
            # Only sync active shipments
            queryset = queryset.exclude(
                status__in=['delivered', 'cancelled', 'returned']
            )

        shipments = queryset.order_by('-created')
        total_count = shipments.count()

        self.stdout.write(f'Found {total_count} shipments to sync')

        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No shipments to sync'))
            return

        updated_count = 0
        error_count = 0

        for i, shipment in enumerate(shipments, 1):
            self.stdout.write(f'Syncing {i}/{total_count}: {shipment.bosta_tracking_number}')
            
            try:
                success = self.sync_shipment(bosta_service, shipment)
                if success:
                    updated_count += 1
                else:
                    error_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Error syncing {shipment.bosta_tracking_number}: {str(e)}')
                )
                error_count += 1

        # Summary
        self.stdout.write(
            self.style.SUCCESS(
                f'Sync complete: {updated_count} updated, {error_count} errors, {total_count} total'
            )
        )

    def sync_shipment(self, bosta_service, shipment):
        """
        Sync a single shipment and return success status.
        """
        try:
            old_status = shipment.status
            result = bosta_service.track_shipment(shipment.bosta_tracking_number)
            
            if result:
                # Refresh shipment from database to get updated status
                shipment.refresh_from_db()
                new_status = shipment.status
                
                if old_status != new_status:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  Status updated: {old_status} → {new_status}'
                        )
                    )
                else:
                    self.stdout.write('  No status change')
                
                return True
            else:
                self.stdout.write(
                    self.style.WARNING(f'  No tracking data returned')
                )
                return False
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  Error: {str(e)}')
            )
            return False 