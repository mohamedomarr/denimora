from django.core.management.base import BaseCommand
from orders.models import GovernorateShipping, DEFAULT_SHIPPING_FEE

class Command(BaseCommand):
    help = 'Populate governorates with default shipping costs'

    # Governorates list from React frontend
    GOVERNORATES = [
        "Cairo",
        "Giza", 
        "Alexandria",
        "Dakahlia",
        "Red Sea",
        "Beheira",
        "Fayoum",
        "Gharbiya",
        "Ismailia",
        "Menofia",
        "Minya",
        "Qaliubiya",
        "New Valley",
        "Suez",
        "Aswan",
        "Assiut",
        "Beni Suef",
        "Port Said",
        "Damietta",
        "Sharkia",
        "South Sinai",
        "Kafr Al sheikh",
        "Matrouh",
        "Luxor",
        "Qena",
        "North Sinai",
        "Sohag",
    ]

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        
        for governorate_name in self.GOVERNORATES:
            governorate, created = GovernorateShipping.objects.get_or_create(
                name=governorate_name,
                defaults={
                    'shipping_cost': DEFAULT_SHIPPING_FEE,
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {governorate_name} - {DEFAULT_SHIPPING_FEE} LE')
                )
            else:
                # Don't update existing records to preserve admin changes
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'Already exists: {governorate_name} - {governorate.shipping_cost} LE')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted! Created: {created_count}, Already existed: {updated_count}'
            )
        )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'All new governorates set to default shipping cost: {DEFAULT_SHIPPING_FEE} LE'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    'You can now customize shipping costs in Django Admin → Orders → Governorate Shipping Rates'
                )
            ) 