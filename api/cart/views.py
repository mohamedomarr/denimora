from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from products.models import Product, Size
from cart.cart import Cart
from .serializers import CartAddSerializer, CartSerializer, CartItemSerializer

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