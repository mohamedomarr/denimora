from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from orders.models import Order, GovernorateShipping
from .serializers import OrderSerializer, OrderCreateSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

@api_view(['GET'])
@permission_classes([AllowAny])
def get_shipping_cost(request):
    """
    Get shipping cost for a specific governorate
    """
    governorate = request.query_params.get('governorate', '')
    
    if not governorate:
        return Response({
            'error': 'Governorate parameter is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get shipping cost using the model's method
    shipping_cost = GovernorateShipping.get_shipping_cost(governorate)
    
    # Check if governorate exists and is active
    try:
        gov_obj = GovernorateShipping.objects.get(name__iexact=governorate, is_active=True)
        governorate_found = True
        is_custom_rate = True
    except GovernorateShipping.DoesNotExist:
        governorate_found = False
        is_custom_rate = False
    
    return Response({
        'governorate': governorate,
        'shipping_cost': float(shipping_cost),
        'governorate_found': governorate_found,
        'is_custom_rate': is_custom_rate,
        'currency': 'LE'
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def list_governorates_shipping(request):
    """
    List all available governorates with their shipping costs
    """
    governorates = GovernorateShipping.objects.filter(is_active=True).order_by('name')
    
    data = [{
        'name': gov.name,
        'shipping_cost': float(gov.shipping_cost),
        'is_active': gov.is_active
    } for gov in governorates]
    
    return Response({
        'governorates': data,
        'default_shipping_cost': 100,
        'currency': 'LE'
    })

class OrderListView(generics.ListAPIView):
    """
    List all orders for the authenticated user
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created')

class OrderDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific order
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        order_id = self.kwargs.get('order_id')
        return get_object_or_404(Order, id=order_id, user=self.request.user)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_order(request):
    """
    Create a new order
    """
    serializer = OrderCreateSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        try:
            order = serializer.save()
            # Return the created order with full details including shipping cost
            response_serializer = OrderSerializer(order)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Handle any exceptions that might occur during order creation
            import traceback
            print(f"Error creating order: {str(e)}")
            print(traceback.format_exc())
            
            # Check if it's a stock-related error
            if 'InsufficientStockError' in str(type(e)):
                return Response({
                    'error': 'Insufficient stock',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'error': 'Failed to create order',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)