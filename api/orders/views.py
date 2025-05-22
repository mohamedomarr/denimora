from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from orders.models import Order
from .serializers import OrderSerializer, OrderCreateSerializer

class OrderListView(generics.ListAPIView):
    """
    List all orders for the authenticated user
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderDetailView(generics.RetrieveAPIView):
    """
    Retrieve a specific order
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderCreateView(generics.CreateAPIView):
    """
    Create a new order
    """
    serializer_class = OrderCreateSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Handle unauthenticated users
        if not request.user.is_authenticated:
            # Check if cart is empty
            from cart.cart import Cart
            cart = Cart(request)
            if len(cart) == 0:
                return Response(
                    {"error": "Cannot create order with empty cart"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        order = serializer.save()
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        ) 