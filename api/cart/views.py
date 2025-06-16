from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from products.models import Product, Size, ProductSize
from cart.cart import Cart
from cart.models import CartReservation
from .serializers import CartAddSerializer, CartSerializer, CartItemSerializer, ReservationSerializer, ReserveItemSerializer, StockValidationSerializer
from django.utils import timezone
from django.db import transaction
from django.db import models
from datetime import timedelta

@api_view(['GET'])
@permission_classes([AllowAny])
def cart_detail(request):
    """
    Get the contents of the cart
    """
    cart = Cart(request)
    cart_items = []
    
    for item in cart:
        cart_item = {
            'product_id': item['product'].id,
            'name': item['product'].name,
            'price': item['price'],
            'quantity': item['quantity'],
            'total_price': item['total_price'],
            'image_url': item['product'].image_url
        }
        
        # Add size information if available
        if 'size' in item:
            cart_item['size_id'] = item['size'].id
            cart_item['size_name'] = item['size'].name
        elif 'size_id' in item and item['size_id']:
            try:
                size = Size.objects.get(id=item['size_id'])
                cart_item['size_id'] = size.id
                cart_item['size_name'] = size.name
            except Size.DoesNotExist:
                cart_item['size_id'] = None
                cart_item['size_name'] = None
        
        cart_items.append(cart_item)
    
    serializer = CartSerializer({
        'items': cart_items,
        'total_price': cart.get_total_price()
    })
    
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def cart_add(request):
    """
    Add a product to the cart
    """
    serializer = CartAddSerializer(data=request.data)
    if serializer.is_valid():
        product_id = serializer.validated_data['product_id']
        product = Product.objects.get(id=product_id)
        
        # Get size if provided
        size_id = serializer.validated_data.get('size_id')
        
        cart = Cart(request)
        cart.add(
            product=product,
            size_id=size_id,
            quantity=serializer.validated_data['quantity'],
            override_quantity=serializer.validated_data['override_quantity']
        )
        return Response({'status': 'success', 'message': 'Product added to cart'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def cart_remove(request):
    """
    Remove a product from the cart
    """
    serializer = CartItemSerializer(data=request.data)
    if serializer.is_valid():
        product_id = serializer.validated_data['product_id']
        size_id = serializer.validated_data.get('size_id')
        
        try:
            # Just need to verify the product exists
            Product.objects.get(id=product_id)
            
            cart = Cart(request)
            cart.remove(product_id, size_id)
            return Response({'status': 'success', 'message': 'Product removed from cart'})
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def cart_clear(request):
    """
    Clear all items from the cart
    """
    cart = Cart(request)
    cart.clear()
    return Response({'status': 'success', 'message': 'Cart cleared'})

@api_view(['POST'])
@permission_classes([AllowAny])
def reserve_item(request):
    """
    Reserve inventory for a cart item (5-minute aggressive reservation)
    """
    serializer = ReserveItemSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    product_id = serializer.validated_data['product_id']
    size_id = serializer.validated_data.get('size_id')
    quantity = serializer.validated_data['quantity']
    session_id = serializer.validated_data['session_id']

    try:
        with transaction.atomic():
            product = Product.objects.get(id=product_id)
            size = Size.objects.get(id=size_id) if size_id else None

            # Auto-cleanup expired reservations before checking stock
            CartReservation.objects.filter(
                expires_at__lt=timezone.now(),
                is_active=True
            ).update(is_active=False)

            # Check available stock
            if size:
                try:
                    product_size = ProductSize.objects.get(product=product, size=size)
                    available_stock = product_size.stock
                except ProductSize.DoesNotExist:
                    available_stock = 0
            else:
                available_stock = product.stock

            # Calculate currently reserved stock
            existing_reservations = CartReservation.objects.filter(
                product=product,
                size=size,
                is_active=True,
                expires_at__gt=timezone.now()
            ).exclude(session_id=session_id)
            
            reserved_stock = sum(r.quantity for r in existing_reservations)
            actual_available = available_stock - reserved_stock

            if quantity > actual_available:
                return Response({
                    'success': False,
                    'error': 'insufficient_stock',
                    'available_stock': actual_available,
                    'message': f'Failed to add this item ! try again in few minutes'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create or update reservation (1 minutes expiry)
            reservation, created = CartReservation.objects.update_or_create(
                session_id=session_id,
                product=product,
                size=size,
                defaults={
                    'quantity': quantity,
                    'expires_at': timezone.now() + timedelta(minutes=1),
                    'is_active': True
                }
            )

            return Response({
                'success': True,
                'reservation_id': reservation.id,
                'expires_at': reservation.expires_at,
                'new_available_stock': actual_available - quantity
            })

    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def release_reservation(request, reservation_id):
    """
    Release a specific reservation
    """
    try:
        reservation = CartReservation.objects.get(
            id=reservation_id,
            is_active=True
        )
        reservation.is_active = False
        reservation.save()
        
        return Response({
            'success': True,
            'message': 'Reservation released'
        })
    except CartReservation.DoesNotExist:
        return Response({'error': 'Reservation not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_cart_stock(request):
    """
    Validate stock availability for cart items - only flag items taken by others
    """
    serializer = StockValidationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    items = serializer.validated_data['items']
    validation_results = []
    all_available = True
    expired_but_taken_items = []

    # First, cleanup expired reservations
    CartReservation.objects.filter(
        expires_at__lt=timezone.now(),
        is_active=True
    ).update(is_active=False)

    for item in items:
        product_id = item.get('product_id')
        size_id = item.get('size_id')
        requested_quantity = item.get('quantity', 1)
        reservation_id = item.get('reservation_id')

        try:
            product = Product.objects.get(id=product_id)
            size = Size.objects.get(id=size_id) if size_id else None

            # Check if current user's reservation is still valid
            user_has_valid_reservation = False
            if reservation_id:
                try:
                    user_reservation = CartReservation.objects.get(
                        id=reservation_id,
                        is_active=True,
                        expires_at__gt=timezone.now()
                    )
                    user_has_valid_reservation = True
                except CartReservation.DoesNotExist:
                    user_has_valid_reservation = False

            # Get total stock
            if size:
                try:
                    product_size = ProductSize.objects.get(product=product, size=size)
                    total_stock = product_size.stock
                except ProductSize.DoesNotExist:
                    total_stock = 0
            else:
                total_stock = product.stock

            # Calculate reserved stock by others
            reserved_stock = CartReservation.objects.filter(
                product=product,
                size=size,
                is_active=True,
                expires_at__gt=timezone.now()
            ).aggregate(total=models.Sum('quantity'))['total'] or 0

            available_stock = total_stock - reserved_stock

            # Determine availability
            is_available = True
            is_expired_and_taken = False

            if not user_has_valid_reservation:
                # User's reservation expired, check if item is still available
                if available_stock < requested_quantity:
                    # Item is not available because others have reserved it
                    is_available = False
                    is_expired_and_taken = True
                    expired_but_taken_items.append({
                        'product_id': product_id,
                        'name': product.name,
                        'size': size.name if size else None
                    })
                # If available_stock >= requested_quantity, item is still available
                # so is_available remains True

            if not is_available:
                all_available = False

            validation_results.append({
                'product_id': product_id,
                'size_id': size_id,
                'product_name': product.name,
                'size_name': size.name if size else None,
                'requested_quantity': requested_quantity,
                'available_stock': available_stock,
                'is_available': is_available,
                'is_expired': not user_has_valid_reservation,
                'is_expired_and_taken': is_expired_and_taken
            })

        except (Product.DoesNotExist, Size.DoesNotExist):
            validation_results.append({
                'product_id': product_id,
                'size_id': size_id,
                'error': 'Product or size not found',
                'is_available': False,
                'is_expired': False,
                'is_expired_and_taken': False
            })
            all_available = False

    return Response({
        'success': all_available,
        'items': validation_results,
        'expired_items': expired_but_taken_items,  # Only items actually taken by others
        'unavailable_items': [
            f"{item['product_name']} ({item.get('size_name', 'No size')})"
            for item in validation_results 
            if not item.get('is_available', False)
        ],
        'has_expired_items': len(expired_but_taken_items) > 0
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_checkout(request):
    """
    Validate cart before checkout - prevent expired reservations only if item taken by others
    Also attempt to re-reserve items that are still available
    """
    serializer = StockValidationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    items = serializer.validated_data['items']
    
    # Cleanup expired reservations
    CartReservation.objects.filter(
        expires_at__lt=timezone.now(),
        is_active=True
    ).update(is_active=False)

    expired_but_taken_items = []
    unavailable_items = []
    renewed_reservations = []
    
    for item in items:
        reservation_id = item.get('reservation_id')
        product_id = item.get('product_id')
        size_id = item.get('size_id')
        quantity = item.get('quantity', 1)
        session_id = request.session.session_key or f"session_{timezone.now().timestamp()}"
        
        try:
            product = Product.objects.get(id=product_id)
            size = Size.objects.get(id=size_id) if size_id else None
            
            # Check if user's reservation exists and is valid
            user_has_valid_reservation = False
            if reservation_id:
                try:
                    reservation = CartReservation.objects.get(
                        id=reservation_id,
                        is_active=True,
                        expires_at__gt=timezone.now()
                    )
                    user_has_valid_reservation = True
                except CartReservation.DoesNotExist:
                    user_has_valid_reservation = False

            # If user doesn't have valid reservation, check if item is still available
            if not user_has_valid_reservation:
                # Get total stock
                if size:
                    try:
                        product_size = ProductSize.objects.get(product=product, size=size)
                        total_stock = product_size.stock
                    except ProductSize.DoesNotExist:
                        total_stock = 0
                else:
                    total_stock = product.stock

                # Calculate reserved stock by others
                reserved_stock = CartReservation.objects.filter(
                    product=product,
                    size=size,
                    is_active=True,
                    expires_at__gt=timezone.now()
                ).aggregate(total=models.Sum('quantity'))['total'] or 0

                available_stock = total_stock - reserved_stock

                # If item is still available, try to create new reservation
                if available_stock >= quantity:
                    try:
                        # Create new reservation for the item
                        new_reservation = CartReservation.objects.create(
                            session_id=session_id,
                            product=product,
                            size=size,
                            quantity=quantity,
                            expires_at=timezone.now() + timedelta(minutes=5),
                            is_active=True
                        )
                        renewed_reservations.append({
                            'product_id': product_id,
                            'reservation_id': new_reservation.id,
                            'expires_at': new_reservation.expires_at
                        })
                    except Exception as e:
                        # If reservation creation fails, still allow if item is available
                        print(f"Failed to create new reservation: {e}")
                else:
                    # Item is not available because others have reserved it
                    expired_but_taken_items.append({
                        'product_id': product_id,
                        'name': product.name,
                        'size': size.name if size else None
                    })
            
        except (Product.DoesNotExist, Size.DoesNotExist):
            unavailable_items.append({
                'product_id': product_id,
                'name': 'Unknown Product',
                'size': 'Unknown Size'
            })

    # Only prevent checkout if items are taken by others
    if expired_but_taken_items or unavailable_items:
        return Response({
            'success': False,
            'can_checkout': False,
            'expired_items': expired_but_taken_items,
            'unavailable_items': unavailable_items,
            'message': 'Failed to proceed ! please try again in few minutes',
            'redirect_to_home': True
        })

    return Response({
        'success': True,
        'can_checkout': True,
        'message': 'Cart is valid for checkout',
        'renewed_reservations': renewed_reservations  # Return new reservation info
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def cleanup_expired_reservations(request):
    """
    Manual cleanup of expired reservations (also done automatically)
    """
    expired_count = CartReservation.objects.filter(
        expires_at__lt=timezone.now(),
        is_active=True
    ).update(is_active=False)
    
    return Response({
        'success': True,
        'expired_reservations_cleaned': expired_count
    }) 

