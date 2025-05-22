from rest_framework import serializers
from orders.models import Order, OrderItem
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity']
        read_only_fields = ['price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_cost = serializers.DecimalField(source='get_total_cost', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'first_name', 'last_name', 'email', 'address', 'city', 
                  'postal_code', 'phone', 'created', 'updated', 'status', 'status_display',
                  'paid', 'items', 'total_cost']
        read_only_fields = ['user', 'created', 'updated', 'paid']

class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['first_name', 'last_name', 'email', 'address', 'city', 'postal_code', 'phone']
        
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request.user.is_authenticated else None
        
        # Create the order
        order = Order.objects.create(
            user=user,
            **validated_data
        )
        
        # Create order items from cart
        from cart.cart import Cart
        cart = Cart(request)
        
        for item in cart:
            OrderItem.objects.create(
                order=order,
                product=item['product'],
                price=item['price'],
                quantity=item['quantity']
            )
            
        # Clear the cart
        cart.clear()
        
        return order 