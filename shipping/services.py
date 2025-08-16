import requests
import logging
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Union
from django.conf import settings
from django.utils import timezone
from .models import BostaShipment, BostaTrackingEvent, BostaSettings, BostaPickupRequest

logger = logging.getLogger(__name__)


class BostaAPIError(Exception):
    """Custom exception for Bosta API errors"""
    pass


class BostaService:
    """
    Service class for handling all Bosta API operations.
    Provides methods for creating shipments, tracking, pickup requests, etc.
    """
    
    def __init__(self):
        self.settings = BostaSettings.get_active_settings()
        if not self.settings:
            raise BostaAPIError("No active Bosta settings found. Please configure Bosta in admin.")
        
        self.api_key = self.settings.api_key
        self.base_url = self.settings.api_base_url.rstrip('/')
        # Don't preset headers since we'll test different auth methods in _make_request

    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """
        Make HTTP request to Bosta API with error handling.
        Based on official Bosta API documentation and SDK patterns.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            data: Request payload
            
        Returns:
            Response data as dictionary
            
        Raises:
            BostaAPIError: If API request fails
        """
        url = f"{self.base_url}{endpoint}"
        
        # Use official Bosta API authentication pattern
        headers = {
            'Authorization': self.api_key,  # Official Bosta pattern
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        try:
            logger.info(f"Making {method} request to Bosta API: {url}")
            
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=data, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise BostaAPIError(f"Unsupported HTTP method: {method}")
            
            # Log response for debugging
            logger.debug(f"Bosta API Response Status: {response.status_code}")
            logger.debug(f"Bosta API Response Headers: {dict(response.headers)}")
            
            # Handle different response statuses
            if response.status_code == 401:
                raise BostaAPIError("Authentication failed. Please check your API key.")
            elif response.status_code == 403:
                raise BostaAPIError("Access forbidden. Please check your API permissions.")
            elif response.status_code == 404:
                raise BostaAPIError("API endpoint not found. Please check the URL.")
            elif response.status_code >= 500:
                raise BostaAPIError(f"Bosta server error: {response.status_code}")
            
            response.raise_for_status()
            
            # Handle empty response
            if not response.content:
                return {}
            
            try:
                return response.json()
            except ValueError as e:
                logger.error(f"Invalid JSON response from Bosta API: {response.text}")
                raise BostaAPIError(f"Invalid JSON response: {str(e)}")
                
        except requests.exceptions.Timeout:
            raise BostaAPIError("Request timeout. Please try again.")
        except requests.exceptions.ConnectionError:
            raise BostaAPIError("Connection error. Please check your internet connection.")
        except requests.exceptions.RequestException as e:
            logger.error(f"Bosta API request failed: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get('message', str(e))
                except:
                    error_message = str(e)
            else:
                error_message = str(e)
            raise BostaAPIError(f"API request failed: {error_message}")
        except BostaAPIError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error in Bosta API request: {str(e)}")
            raise BostaAPIError(f"Unexpected error: {str(e)}")

    def create_shipment(self, shipment: BostaShipment) -> Optional[Dict]:
        """
        Create a shipment in Bosta for the given BostaShipment instance.
        
        Args:
            shipment: BostaShipment instance
            
        Returns:
            Bosta API response data or None if failed
        """
        order = shipment.order
        
        # Prepare shipment data with correct Bosta mapping
        resolved_zone = self._resolve_zone_name(order, None)
        
        # Use Bosta's correct city code and Arabic name for Gharbiya
        user_selected_governorate = (order.governorate or '').strip()
        
        # Complete mapping to Bosta's actual city data (all in Arabic)
        governorate_to_bosta = {
            # Cairo variants
            'cairo': ('EG-01', 'القاهره'),
            'al qahirah': ('EG-01', 'القاهره'),
            'el qahira': ('EG-01', 'القاهره'),
            'القاهرة': ('EG-01', 'القاهره'),
            'القاهره': ('EG-01', 'القاهره'),
            
            # Alexandria variants  
            'alexandria': ('EG-02', 'الاسكندريه'),
            'iskandariya': ('EG-02', 'الاسكندريه'),
            'alex': ('EG-02', 'الاسكندريه'),
            'الاسكندرية': ('EG-02', 'الاسكندريه'),
            'الإسكندرية': ('EG-02', 'الاسكندريه'),
            'الاسكندريه': ('EG-02', 'الاسكندريه'),
            
            # Giza variants
            'giza': ('EG-25', 'الجيزه'),
            'gizah': ('EG-25', 'الجيزه'),
            'الجيزة': ('EG-25', 'الجيزه'),
            'الجيزه': ('EG-25', 'الجيزه'),
            
            # Dakahlia variants
            'dakahlia': ('EG-05', 'الدقهليه'),
            'dakhliya': ('EG-05', 'الدقهليه'),
            'الدقهلية': ('EG-05', 'الدقهليه'),
            'الدقهليه': ('EG-05', 'الدقهليه'),
            
            # Beheira variants
            'beheira': ('EG-04', 'البحيره'),
            'behira': ('EG-04', 'البحيره'),
            'البحيرة': ('EG-04', 'البحيره'),
            'البحيره': ('EG-04', 'البحيره'),
            
            # Gharbiya variants
            'gharbiya': ('EG-07', 'الغربيه'),
            'gharbia': ('EG-07', 'الغربيه'),
            'gharbeya': ('EG-07', 'الغربيه'),
            'الغربية': ('EG-07', 'الغربيه'),
            'الغربيه': ('EG-07', 'الغربيه'),
            
            # Kafr Al Sheikh variants
            'kafr al sheikh': ('EG-08', 'كفر الشيخ'),
            'kafr el sheikh': ('EG-08', 'كفر الشيخ'),
            'kafralshiekh': ('EG-08', 'كفر الشيخ'),
            'كفر الشيخ': ('EG-08', 'كفر الشيخ'),
            
            # Qalyubia variants
            'qalyubia': ('EG-06', 'القليوبيه'),
            'qalyubiya': ('EG-06', 'القليوبيه'), 
            'qaliubiya': ('EG-06', 'القليوبيه'),
            'el kaluobia': ('EG-06', 'القليوبيه'),
            'القليوبية': ('EG-06', 'القليوبيه'),
            'القليوبيه': ('EG-06', 'القليوبيه'),
            
            # Sharqia variants
            'sharqia': ('EG-10', 'الشرقيه'),
            'sharkia': ('EG-10', 'الشرقيه'),
            'الشرقية': ('EG-10', 'الشرقيه'),
            'الشرقيه': ('EG-10', 'الشرقيه'),
            
            # Menofia variants
            'menofia': ('EG-09', 'المنوفيه'),
            'menoufia': ('EG-09', 'المنوفيه'),
            'المنوفية': ('EG-09', 'المنوفيه'),
            'المنوفيه': ('EG-09', 'المنوفيه'),
            
            # Aswan variants
            'aswan': ('EG-21', 'اسوان'),
            'asuan': ('EG-21', 'اسوان'),
            'أسوان': ('EG-21', 'اسوان'),
            'اسوان': ('EG-21', 'اسوان'),
            
            # Red Sea variants
            'red sea': ('EG-23', 'البحر الاحمر'),
            'red_sea': ('EG-23', 'البحر الاحمر'),
            'redsea': ('EG-23', 'البحر الاحمر'),
            'البحر الأحمر': ('EG-23', 'البحر الاحمر'),
            'البحر الاحمر': ('EG-23', 'البحر الاحمر'),
            
            # Luxor variants
            'luxor': ('EG-22', 'الاقصر'),
            'الأقصر': ('EG-22', 'الاقصر'),
            'الاقصر': ('EG-22', 'الاقصر'),
            
            # Asyut variants
            'asyut': ('EG-17', 'اسيوط'),
            'assiut': ('EG-17', 'اسيوط'),
            'أسيوط': ('EG-17', 'اسيوط'),
            'اسيوط': ('EG-17', 'اسيوط'),
            
            # Sohag variants
            'sohag': ('EG-18', 'سوهاج'),
            'suhag': ('EG-18', 'سوهاج'),
            'سوهاج': ('EG-18', 'سوهاج'),
            
            # Qena variants
            'qena': ('EG-20', 'قنا'),
            'qina': ('EG-20', 'قنا'),
            'قنا': ('EG-20', 'قنا'),
            
            # Minya variants
            'minya': ('EG-19', 'المنيا'),
            'minia': ('EG-19', 'المنيا'),
            'المنيا': ('EG-19', 'المنيا'),
            
            # Beni Suef variants
            'beni suef': ('EG-16', 'بني سويف'),
            'beni_suef': ('EG-16', 'بني سويف'),
            'benisuef': ('EG-16', 'بني سويف'),
            'بني سويف': ('EG-16', 'بني سويف'),
            
            # Fayoum variants
            'fayoum': ('EG-15', 'الفيوم'),
            'fayyum': ('EG-15', 'الفيوم'),
            'الفيوم': ('EG-15', 'الفيوم'),
            
            # Ismailia variants
            'ismailia': ('EG-11', 'الاسماعيليه'),
            'ismailiya': ('EG-11', 'الاسماعيليه'),
            'الإسماعيلية': ('EG-11', 'الاسماعيليه'),
            'الاسماعيليه': ('EG-11', 'الاسماعيليه'),
            
            # Suez variants
            'suez': ('EG-12', 'السويس'),
            'السويس': ('EG-12', 'السويس'),
            
            # Port Said variants
            'port said': ('EG-13', 'بور سعيد'),
            'port_said': ('EG-13', 'بور سعيد'),
            'portsaid': ('EG-13', 'بور سعيد'),
            'بور سعيد': ('EG-13', 'بور سعيد'),
            
            # Damietta variants
            'damietta': ('EG-14', 'دمياط'),
            'dumyat': ('EG-14', 'دمياط'),
            'دمياط': ('EG-14', 'دمياط'),
            
            # North Sinai variants
            'north sinai': ('EG-27', 'شمال سيناء'),
            'north_sinai': ('EG-27', 'شمال سيناء'),
            'northsinai': ('EG-27', 'شمال سيناء'),
            'شمال سيناء': ('EG-27', 'شمال سيناء'),
            
            # South Sinai variants
            'south sinai': ('EG-26', 'جنوب سيناء'),
            'south_sinai': ('EG-26', 'جنوب سيناء'),
            'southsinai': ('EG-26', 'جنوب سيناء'),
            'جنوب سيناء': ('EG-26', 'جنوب سيناء'),
            
            # New Valley variants
            'new valley': ('EG-24', 'الوادي الجديد'),
            'new_valley': ('EG-24', 'الوادي الجديد'),
            'newvalley': ('EG-24', 'الوادي الجديد'),
            'الوادي الجديد': ('EG-24', 'الوادي الجديد'),
            
            # Matrouh variants
            'matrouh': ('EG-28', 'مرسي مطروح'),
            'matruh': ('EG-28', 'مرسي مطروح'),
            'مطروح': ('EG-28', 'مرسي مطروح'),
            'مرسي مطروح': ('EG-28', 'مرسي مطروح'),
        }
        
        # Look up the governorate in our mapping
        lookup_key = user_selected_governorate.lower().strip()
        if lookup_key in governorate_to_bosta:
            bosta_city_code, bosta_city_name = governorate_to_bosta[lookup_key]
        else:
            # Fallback to Cairo if not found
            bosta_city_code, bosta_city_name = ('EG-01', 'القاهره')
        
        shipment_data = {
            'type': 10,
            'dropOffAddress': {
                'firstLine': order.address,
                # Use Bosta's exact city code and name to match their database
                'cityCode': bosta_city_code,        # Correct Bosta code
                'city': bosta_city_name,            # Bosta's exact name
                'cityName': bosta_city_name,        # Bosta's exact name (reinforcement)
                'zone': resolved_zone,              # District/city within governorate
                'buildingNumber': '',
                'floor': '',
                'apartment': ''
            },
            'receiver': {
                'firstName': order.first_name,
                'lastName': order.last_name,
                'phone': order.phone,
                'email': order.email
            },
            'notes': f"Order #{order.id} - {order.address}",
            'businessReference': f"DENIM-{order.id}",
        }
        
        # Add pickup address if configured
        if self.settings.default_pickup_address:
            shipment_data['pickupAddress'] = self.settings.default_pickup_address
        
        # Add COD amount for cash collection
        if shipment.is_cod_shipment():
            cod_amount = shipment.cod_amount or order.get_total_cost_with_shipping()
            shipment_data['cod'] = float(cod_amount)
        
        try:
            # Use v1 API for shipment creation (v2 doesn't exist according to official docs)
            response_data = self._make_request('POST', '/api/v1/deliveries', shipment_data)
            
            # Update shipment with Bosta response
            shipment.bosta_tracking_number = response_data.get('trackingNumber')
            shipment.bosta_delivery_id = response_data.get('_id')
            shipment.bosta_response_data = response_data
            shipment.status = 'pickup_requested'
            shipment.save()
            
            # Create initial tracking event
            self._create_tracking_event(
                shipment=shipment,
                event_type='created',
                event_description='Shipment created in Bosta',
                event_timestamp=timezone.now()
            )
            
            logger.info(f"Created Bosta shipment for Order #{order.id}: {shipment.bosta_tracking_number}")
            return response_data
            
        except BostaAPIError as e:
            logger.error(f"Failed to create Bosta shipment for Order #{order.id}: {str(e)}")
            return None

    def track_shipment(self, tracking_number: str) -> Optional[Dict]:
        """
        Get tracking information for a shipment.
        
        Args:
            tracking_number: Bosta tracking number
            
        Returns:
            Tracking data or None if failed
        """
        try:
            # Use v1 API for tracking
            response_data = self._make_request('GET', f'/api/v1/deliveries/track/{tracking_number}')
            
            # Update shipment status based on tracking data
            try:
                shipment = BostaShipment.objects.get(bosta_tracking_number=tracking_number)
                self._update_shipment_from_tracking(shipment, response_data)
            except BostaShipment.DoesNotExist:
                logger.warning(f"Shipment with tracking number {tracking_number} not found in database")
            
            return response_data
            
        except BostaAPIError as e:
            logger.error(f"Failed to track shipment {tracking_number}: {str(e)}")
            return None

    def get_shipment_details(self, delivery_id: str) -> Optional[Dict]:
        """
        Get detailed shipment information by delivery ID.
        
        Args:
            delivery_id: Bosta delivery ID
            
        Returns:
            Shipment details or None if failed
        """
        try:
            # Use v1 API for shipment details
            response_data = self._make_request('GET', f'/api/v1/deliveries/{delivery_id}')
            return response_data
        except BostaAPIError as e:
            logger.error(f"Failed to get shipment details for {delivery_id}: {str(e)}")
            return None

    def create_pickup_request(self, shipments: List[BostaShipment]) -> Optional[BostaPickupRequest]:
        """
        Create a pickup request for multiple shipments.
        
        Args:
            shipments: List of BostaShipment instances
            
        Returns:
            Created BostaPickupRequest instance or None if failed
        """
        if not shipments:
            return None
        
        # Use tomorrow as default pickup date
        pickup_date = date.today() + timedelta(days=1)
        
        pickup_data = {
            # Per Bosta docs: https://docs.bosta.co/api/#/paths/pickups/post
            'date': pickup_date.strftime('%Y-%m-%d'),
            'timeSlot': '10:00 to 13:00',  # Default time slot
            'businessLocationId': self._get_business_location_id(),
            'contactPerson': {
                'name': 'Denimora Team',
                'phone': '+201234567890',  # Configure this in settings
                'email': 'shipping@denimora.com'
            },
            'notes': f'Pickup for {len(shipments)} shipments',
            'noOfPackages': len(shipments)
        }
        
        # Validate required fields
        if not pickup_data.get('businessLocationId'):
            logger.error("Cannot create pickup: businessLocationId is not configured. Set it in Bosta Settings (business_reference).")
            return None

        # Try known pickup endpoints in order (differs by account/version)
        candidate_endpoints = [
            '/api/v1/pickups',                 # per docs
            '/api/v1/pickup-requests',         # legacy
            '/api/v1/pickups/schedule',        # alternate
            '/pickups',                        # bare
        ]

        response_data = None
        last_error: Optional[str] = None
        for ep in candidate_endpoints:
            try:
                logger.info(f"Attempting Bosta pickup endpoint: {self.base_url}{ep}")
                response_data = self._make_request('POST', ep, pickup_data)
                break
            except BostaAPIError as e:
                err = str(e)
                last_error = err
                # If clearly endpoint not found, try next; otherwise abort
                if '404' in err or 'not found' in err.lower():
                    continue
                else:
                    logger.error(f"Failed to create pickup request: {err}")
                    return None

        if response_data is None:
            logger.error(f"Failed to create pickup request: API endpoint not found after trying {candidate_endpoints}. Last error: {last_error}")
            return None

        # Create BostaPickupRequest instance
        pickup_request = BostaPickupRequest.objects.create(
            bosta_pickup_id=response_data.get('_id'),
            scheduled_date=pickup_date,
            scheduled_time_slot='10:00 to 13:00',
            pickup_address=self.settings.default_pickup_address or {},
            contact_name='Denimora Team',
            contact_phone='+201234567890',
            contact_email='shipping@denimora.com',
            status='scheduled',
            number_of_packages=len(shipments),
            bosta_response_data=response_data
        )
        
        # Link shipments to pickup request
        for shipment in shipments:
            shipment.pickup_request = pickup_request
            shipment.pickup_date = timezone.now()
            shipment.save()
        
        logger.info(f"Created pickup request {pickup_request.bosta_pickup_id} for {len(shipments)} shipments")
        return pickup_request

    def cancel_shipment(self, delivery_id: str) -> bool:
        """
        Cancel a shipment in Bosta.
        
        Args:
            delivery_id: Bosta delivery ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Use v1 API for cancellation
            self._make_request('DELETE', f'/api/v1/deliveries/{delivery_id}')
            
            # Update local shipment status
            try:
                shipment = BostaShipment.objects.get(bosta_delivery_id=delivery_id)
                shipment.status = 'cancelled'
                shipment.save()
                
                self._create_tracking_event(
                    shipment=shipment,
                    event_type='cancelled',
                    event_description='Shipment cancelled',
                    event_timestamp=timezone.now()
                )
            except BostaShipment.DoesNotExist:
                pass
            
            logger.info(f"Cancelled shipment {delivery_id}")
            return True
            
        except BostaAPIError as e:
            logger.error(f"Failed to cancel shipment {delivery_id}: {str(e)}")
            return False

    def get_cities(self) -> List[Dict]:
        """
        Get list of supported cities from Bosta.
        
        Returns:
            List of city data
        """
        try:
            # Use v1 API for cities (v2 API has limited functionality)
            response_data = self._make_request('GET', '/api/v1/cities')
            # Bosta API returns cities in 'data' field, not 'cities'
            return response_data.get('data', [])
        except BostaAPIError as e:
            logger.error(f"Failed to get cities: {str(e)}")
            return []

    def handle_webhook(self, webhook_data: Dict) -> bool:
        """
        Process incoming webhook from Bosta.
        
        Args:
            webhook_data: Webhook payload from Bosta
            
        Returns:
            True if processed successfully, False otherwise
        """
        try:
            tracking_number = webhook_data.get('trackingNumber')
            if not tracking_number:
                logger.warning("Webhook received without tracking number")
                return False
            
            # Find the shipment
            try:
                shipment = BostaShipment.objects.get(bosta_tracking_number=tracking_number)
            except BostaShipment.DoesNotExist:
                logger.warning(f"Shipment with tracking number {tracking_number} not found")
                return False
            
            # Update shipment based on webhook data
            self._update_shipment_from_webhook(shipment, webhook_data)
            
            logger.info(f"Processed webhook for shipment {tracking_number}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return False

    def _update_shipment_from_tracking(self, shipment: BostaShipment, tracking_data: Dict):
        """Update shipment status based on tracking API response"""
        current_state = tracking_data.get('state', {})
        state_code = current_state.get('code')
        
        # Map Bosta states to our status values
        status_mapping = {
            0: 'pending',
            1: 'pickup_requested', 
            2: 'picked_up',
            3: 'in_transit',
            4: 'delivered',
            5: 'cancelled',
            6: 'returned',
            7: 'exception'
        }
        
        new_status = status_mapping.get(state_code, shipment.status)
        
        if new_status != shipment.status:
            shipment.status = new_status
            
            # Update delivery date if delivered
            if new_status == 'delivered' and not shipment.delivery_date:
                shipment.delivery_date = timezone.now()
                
                # Mark COD as collected if this is a COD shipment
                if shipment.is_cod_shipment():
                    shipment.cod_collected = True
                    shipment.cod_collection_date = timezone.now()
            
            shipment.save()
            
            # Create tracking event
            self._create_tracking_event(
                shipment=shipment,
                event_type=new_status,
                event_description=current_state.get('value', f'Status updated to {new_status}'),
                event_timestamp=timezone.now()
            )

    def _update_shipment_from_webhook(self, shipment: BostaShipment, webhook_data: Dict):
        """Update shipment based on webhook data"""
        # Create tracking event from webhook
        event_type = webhook_data.get('state', {}).get('code', 'unknown')
        event_description = webhook_data.get('state', {}).get('value', 'Status update')
        
        self._create_tracking_event(
            shipment=shipment,
            event_type=str(event_type),
            event_description=event_description,
            event_timestamp=timezone.now(),
            webhook_data=webhook_data
        )
        
        # Update shipment status similar to tracking
        self._update_shipment_from_tracking(shipment, webhook_data)

    def _create_tracking_event(self, shipment: BostaShipment, event_type: str, 
                             event_description: str, event_timestamp: datetime,
                             webhook_data: Dict = None):
        """Create a tracking event"""
        BostaTrackingEvent.objects.create(
            shipment=shipment,
            event_type=event_type,
            event_description=event_description,
            event_timestamp=event_timestamp,
            webhook_data=webhook_data
        )

    def _get_bosta_city_code(self, city_name: str) -> str:
        """
        Map city name to Bosta city code.
        This should be updated based on Bosta's city codes.
        """
        # Common Egyptian governorates to Bosta codes mapping (canonical names)
        city_mapping = {
            'Cairo': 'EG-01',
            'Giza': 'EG-02', 
            'Alexandria': 'EG-03',
            'Dakahlia': 'EG-04',
            'Beheira': 'EG-05',
            'Gharbiya': 'EG-07',
            'Kafr Al Sheikh': 'EG-06',
            'Qalyubia': 'EG-08',
            'Sharqia': 'EG-09',
            'Menofia': 'EG-10',
        }

        # Aliases/normalizations mapped directly to codes (lowercased keys)
        alias_to_code = {
            # Gharbiya variants
            'gharbiya': 'EG-07',
            'gharbia': 'EG-07',
            'gharbeya': 'EG-07',
            'el gharbiya': 'EG-07',
            'el gharbeya': 'EG-07',
            'el-gharbiya': 'EG-07',
            'elgharbiya': 'EG-07',
            'الغربية': 'EG-07',
            'الغربيه': 'EG-07',  # Bosta's exact Arabic spelling
            # Qalyubia variants (El Kaluobia)
            'qalyubia': 'EG-08',
            'qalyubiya': 'EG-08',
            'qaliubiya': 'EG-08',
            'qalubia': 'EG-08',
            'el qalyubia': 'EG-08',
            'el qalubia': 'EG-08',
            'el kaluobia': 'EG-08',
            'القليوبية': 'EG-08',
            # Kafr El/Al Sheikh variants
            'kafr el sheikh': 'EG-07',
            'kafr al sheikh': 'EG-07',
            'kafr el-sheikh': 'EG-07',
            'كفر الشيخ': 'EG-07',
            # Sharqia variants
            'sharqia': 'EG-09',
            'sharkia': 'EG-09',
            'الشرقية': 'EG-09',
            # Cairo, Giza, Alex, Dakahlia, Beheira, Menofia (Arabic)
            'القاهرة': 'EG-01',
            'الجيزة': 'EG-02',
            'الاسكندرية': 'EG-03',
            'الإسكندرية': 'EG-03',
            'الدقهلية': 'EG-04',
            'البحيرة': 'EG-05',
            'المنوفية': 'EG-10',
        }

        def _normalize(name: str) -> str:
            if not name:
                return ''
            n = name.strip().lower()
            n = n.replace('_', ' ').replace('-', ' ')
            # collapse multiple spaces
            n = ' '.join(n.split())
            return n

        norm = _normalize(city_name)
        if norm in alias_to_code:
            return alias_to_code[norm]

        # Try canonical name lookup (case-insensitive)
        for canonical, code in city_mapping.items():
            if _normalize(canonical) == norm:
                return code

        # Default to Cairo if unknown
        # Heuristic fallback by substring to reduce mis-mapping
        if any(key in norm for key in ['gharb', 'gharbi', 'الغرب']):
            return 'EG-07'  # Gharbiya
        if any(key in norm for key in ['qalyu', 'qaliu', 'qalub', 'kaliob', 'قليوب', 'القليو']):
            return 'EG-08'  # Qalyubia
        if any(key in norm for key in ['kafr', 'sheikh', 'الشيخ']):
            return 'EG-06'  # Kafr El Sheikh
        if any(key in norm for key in ['sharq', 'shark', 'الشر']):
            return 'EG-09'  # Sharqia
        return 'EG-01'

    def _resolve_city_code(self, order) -> str:
        """Resolve best city code from order data (prefer governorate, fallback to city)."""
        # Prefer governorate name when present, else city. Use exact string received from frontend.
        chosen_governorate = (order.governorate or '').strip()
        fallback_city = (order.city or '').strip()
        target = chosen_governorate or fallback_city or 'Cairo'
        return self._get_bosta_city_code(target)

    def _get_canonical_city_name(self, city_code: str) -> str:
        mapping = {
            'EG-01': 'Cairo',
            'EG-02': 'Giza',
            'EG-03': 'Alexandria',
            'EG-04': 'Dakahlia',
            'EG-05': 'Beheira',
            'EG-06': 'Kafr Al Sheikh',
            'EG-07': 'Gharbiya',
            'EG-08': 'Qalyubia',
            'EG-09': 'Sharqia',
            'EG-10': 'Menofia',
        }
        return mapping.get(city_code, 'Cairo')

    def _resolve_zone_name(self, order, city_code: str = None) -> str:
        # If zone (district) equals the canonical governorate name, keep user's city value to avoid Bosta overriding
        user_zone = (order.city or '').strip() or (order.governorate or '').strip()
        return user_zone

    def _get_business_location_id(self) -> str:
        """
        Get business location ID for pickup requests.
        This should be configured in BostaSettings or fetched from API.
        """
        # Prefer a configured value from settings (reuse business_reference for now)
        if getattr(self.settings, 'business_reference', None):
            return self.settings.business_reference
        # Fallback placeholder (must be replaced with a real value in admin)
        return ""


class BostaOrderIntegration:
    """
    Service class for integrating Bosta with order processing.
    Handles automatic shipment creation and status updates.
    """
    
    def __init__(self):
        self.bosta_service = BostaService()
        self.settings = BostaSettings.get_active_settings()

    def create_shipment_for_order(self, order) -> Optional[BostaShipment]:
        """
        Create a Bosta shipment for an order.
        
        Args:
            order: Order instance
            
        Returns:
            Created BostaShipment instance or None if failed
        """
        # Check if shipment already exists
        if hasattr(order, 'bosta_shipment'):
            return order.bosta_shipment
        
        # Determine shipment type based on order payment status
        delivery_type = 20 if not order.paid else 10  # COD if not paid, regular delivery if paid
        
        # Calculate COD amount
        cod_amount = order.get_total_cost_with_shipping() if delivery_type == 20 else None
        
        # Create shipment record
        shipment = BostaShipment.objects.create(
            order=order,
            delivery_type=delivery_type,
            cod_amount=cod_amount,
            status='pending'
        )
        
        # Create shipment in Bosta if auto-creation is enabled
        if self.settings and self.settings.auto_create_shipments:
            result = self.bosta_service.create_shipment(shipment)
            if result and self.settings.auto_request_pickup:
                # Auto-request pickup if enabled
                self.bosta_service.create_pickup_request([shipment])
        
        return shipment

    def sync_order_status(self, order):
        """
        Sync order status with Bosta shipment status.
        
        Args:
            order: Order instance
        """
        if not hasattr(order, 'bosta_shipment'):
            return
        
        shipment = order.bosta_shipment
        
        # Update order status based on shipment status
        if shipment.status == 'delivered' and order.status != 'delivered':
            order.status = 'delivered'
            order.save()
            
        elif shipment.status == 'in_transit' and order.status == 'pending':
            order.status = 'shipped'
            order.save() 