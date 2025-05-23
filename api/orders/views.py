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
        print(f"Received order creation request: {request.data}")

        # Check if there are items in the request data
        has_items_in_request = 'items' in request.data and len(request.data['items']) > 0

        # Check if there are items in the session cart
        from cart.cart import Cart
        cart = Cart(request)
        has_items_in_session = len(cart) > 0

        # If no items in request or session, return error
        if not has_items_in_request and not has_items_in_session:
            return Response(
                {"error": "Cannot create order with empty cart. Please add items to your cart."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            print(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Import the custom exception
            from orders.exceptions import InsufficientStockError

            try:
                order = serializer.save()
                print(f"Order created successfully: {order.id}")
                return Response(
                    OrderSerializer(order).data,
                    status=status.HTTP_201_CREATED
                )
            except InsufficientStockError as stock_error:
                # Handle insufficient stock error specifically
                print(f"Insufficient stock error: {str(stock_error)}")
                error_message = str(stock_error)

                # Create a more user-friendly message
                if stock_error.size_name:
                    user_message = f"Sorry, we don't have enough '{stock_error.product_name}' in size '{stock_error.size_name}' in stock. " \
                                  f"You requested {stock_error.requested_quantity}, but we only have {stock_error.available_quantity} available."
                else:
                    user_message = f"Sorry, we don't have enough '{stock_error.product_name}' in stock. " \
                                  f"You requested {stock_error.requested_quantity}, but we only have {stock_error.available_quantity} available."

                return Response(
                    {
                        "error": "Insufficient stock",
                        "message": user_message,
                        "details": {
                            "product_name": stock_error.product_name,
                            "size_name": stock_error.size_name,
                            "requested_quantity": stock_error.requested_quantity,
                            "available_quantity": stock_error.available_quantity
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Exception as e:
            print(f"Error creating order: {str(e)}")
            return Response(
                {"error": f"Failed to create order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )