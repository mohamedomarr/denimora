from django.core.management.base import BaseCommand
from communications.utils import sync_order_emails

class Command(BaseCommand):
    help = 'Sync existing order emails to the consolidated email list'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be synced without actually doing it',
        )

    def handle(self, *args, **options):
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN MODE: No changes will be made')
            )
            # For dry run, we'll just count the orders
            from orders.models import Order
            orders_count = Order.objects.filter(email__isnull=False).exclude(email='').count()
            self.stdout.write(
                self.style.SUCCESS(f'Found {orders_count} orders with email addresses that would be synced')
            )
        else:
            self.stdout.write('Syncing order emails to consolidated email list...')
            
            try:
                synced_count = sync_order_emails()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully synced {synced_count} order emails to consolidated list')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error syncing emails: {e}')
                ) 