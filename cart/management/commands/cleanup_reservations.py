from django.core.management.base import BaseCommand
from django.utils import timezone
from cart.models import CartReservation


class Command(BaseCommand):
    help = 'Clean up expired cart reservations and free up inventory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be cleaned without actually cleaning',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed information about cleaned reservations',
        )

    def handle(self, *args, **options):
        """
        Main command logic to clean up expired reservations
        """
        # Find expired reservations
        expired_reservations = CartReservation.objects.filter(
            expires_at__lt=timezone.now(),
            is_active=True
        )

        expired_count = expired_reservations.count()

        if expired_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No expired reservations found to clean up.')
            )
            return

        # Show what will be cleaned if dry-run
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would clean up {expired_count} expired reservations:')
            )
            
            if options['verbose']:
                for reservation in expired_reservations:
                    size_info = f" - {reservation.size.name}" if reservation.size else ""
                    self.stdout.write(
                        f"  - {reservation.product.name}{size_info} "
                        f"(Qty: {reservation.quantity}, Expired: {reservation.expires_at})"
                    )
            return

        # Show detailed info if verbose
        if options['verbose']:
            self.stdout.write(f'Cleaning up {expired_count} expired reservations:')
            
            for reservation in expired_reservations:
                size_info = f" - {reservation.size.name}" if reservation.size else ""
                self.stdout.write(
                    f"  - {reservation.product.name}{size_info} "
                    f"(Qty: {reservation.quantity}, Expired: {reservation.expires_at})"
                )

        # Actually clean up the reservations
        updated_count = expired_reservations.update(is_active=False)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully cleaned up {updated_count} expired reservations. '
                f'Inventory has been freed up for new customers.'
            )
        )

        # Provide some statistics
        if options['verbose']:
            # Show current active reservations
            active_count = CartReservation.objects.filter(is_active=True).count()
            self.stdout.write(f'Active reservations remaining: {active_count}')
            
            # Show reservations expiring in next hour
            next_hour = timezone.now() + timezone.timedelta(hours=1)
            expiring_soon = CartReservation.objects.filter(
                is_active=True,
                expires_at__lt=next_hour
            ).count()
            
            if expiring_soon > 0:
                self.stdout.write(
                    self.style.WARNING(
                        f'{expiring_soon} reservations will expire soon'
                    )
                ) 