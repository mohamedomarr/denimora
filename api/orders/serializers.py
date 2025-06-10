from rest_framework import serializers
from orders.models import Order, OrderItem
from products.models import Product

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'size_name', 'size_id']
        read_only_fields = ['price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_cost = serializers.DecimalField(source='get_total_cost', max_digits=10, decimal_places=2, read_only=True)
    shipping_cost = serializers.DecimalField(source='get_shipping_cost', max_digits=10, decimal_places=2, read_only=True)
    total_cost_with_shipping = serializers.DecimalField(source='get_total_cost_with_shipping', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'first_name', 'last_name', 'email', 'address', 'city',
                  'postal_code', 'phone', 'governorate', 'created', 'updated', 'status', 'status_display',
                  'paid', 'items', 'total_cost', 'shipping_cost', 'total_cost_with_shipping']
        read_only_fields = ['user', 'created', 'updated', 'paid']

class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=False)
    name = serializers.CharField(required=True)
    price = serializers.FloatField(required=True)
    quantity = serializers.IntegerField(required=True)
    size = serializers.CharField(required=False, allow_null=True)
    size_id = serializers.IntegerField(required=False, allow_null=True)

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, required=False)
    state = serializers.CharField(required=False, allow_blank=True, write_only=True, help_text="Governorate name from frontend")

    class Meta:
        model = Order
        fields = ['first_name', 'last_name', 'email', 'address', 'city', 'postal_code', 'phone', 'governorate', 'state', 'items']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request.user.is_authenticated else None
        items_data = validated_data.pop('items', [])
        
        # Handle the state field mapping to governorate
        state = validated_data.pop('state', None)
        if state and not validated_data.get('governorate'):
            validated_data['governorate'] = state

        # Import the custom exception
        from orders.exceptions import InsufficientStockError
        from products.models import Product, ProductSize
        from django.db import transaction

        # Determine data source: either from request items or session cart
        cart_items = []
        if items_data:
            # Use items from request data
            print(f"Using items from request data: {len(items_data)} items")
            for item_data in items_data:
                cart_items.append({
                    'product_id': item_data.get('product_id'),
                    'name': item_data.get('name'),
                    'price': item_data['price'],
                    'quantity': item_data['quantity'],
                    'size_name': item_data.get('size'),
                    'size_id': item_data.get('size_id'),
                    'is_request_item': True
                })
        else:
            # Fallback to session cart
            print("No items in request data, checking session cart")
            from cart.cart import Cart
            cart = Cart(request)
            
            for item in cart:
                size_id = None
                size_name = None
                
                # Extract size information from cart item
                if 'size' in item and hasattr(item['size'], 'id'):
                    size_id = item['size'].id
                    size_name = item['size'].name
                elif 'size_id' in item:
                    size_id = item['size_id']
                    size_name = item.get('size_name', None)
                
                cart_items.append({
                    'product_id': item['product'].id if item['product'] else None,
                    'product': item['product'],
                    'name': item['product'].name if item['product'] else item.get('name', ''),
                    'price': item['price'],
                    'quantity': item['quantity'],
                    'size_name': size_name,
                    'size_id': size_id,
                    'is_request_item': False
                })

        # Validate stock for all items before creating the order
        if cart_items:
            print(f"Validating stock for {len(cart_items)} items")
            for cart_item in cart_items:
                product_id = cart_item.get('product_id')
                if not product_id:
                    continue  # Skip validation for custom items without product_id

                try:
                    product = cart_item.get('product') if not cart_item['is_request_item'] else Product.objects.get(id=product_id)
                    quantity = cart_item['quantity']
                    size_id = cart_item.get('size_id')
                    size_name = cart_item.get('size_name')

                    # Check stock for product with specific size
                    if size_id:
                        try:
                            product_size = ProductSize.objects.get(
                                product=product,
                                size_id=size_id
                            )
                            if product_size.stock < quantity:
                                raise InsufficientStockError(
                                    product.name,
                                    size_name or product_size.size.name,
                                    quantity,
                                    product_size.stock
                                )
                        except ProductSize.DoesNotExist:
                            # If ProductSize doesn't exist, check general product stock
                            if product.stock < quantity:
                                raise InsufficientStockError(
                                    product.name,
                                    None,
                                    quantity,
                                    product.stock
                                )
                    # Check general product stock if no size specified
                    elif product.stock < quantity:
                        raise InsufficientStockError(
                            product.name,
                            None,
                            quantity,
                            product.stock
                        )
                except Product.DoesNotExist:
                    print(f"Product with ID {product_id} not found")

        # Use single transaction to ensure all operations succeed or fail together
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=user,
                **validated_data
            )

            # Add email to consolidated email list
            try:
                from communications.utils import add_to_email_list
                name = f"{order.first_name} {order.last_name}".strip()
                add_to_email_list(
                    email=order.email,
                    name=name,
                    source='order',
                    user=user,
                    increment_order=True
                )
            except ImportError:
                print("Communications app not available - skipping email list update")
            except Exception as e:
                print(f"Error updating email list: {e}")

            # Process all cart items
            if cart_items:
                print(f"Creating order items: {len(cart_items)} items")
                for cart_item in cart_items:
                    product_id = cart_item.get('product_id')
                    product = None

                    if product_id:
                        if cart_item['is_request_item']:
                            try:
                                product = Product.objects.get(id=product_id)
                            except Product.DoesNotExist:
                                print(f"Product with ID {product_id} not found")
                        else:
                            product = cart_item.get('product')

                    # Create the order item with size information
                    OrderItem.objects.create(
                        order=order,
                        product=product,  # Can be None for custom items
                        price=cart_item['price'],
                        quantity=cart_item['quantity'],
                        size_name=cart_item.get('size_name'),
                        size_id=cart_item.get('size_id')
                    )

                    # Update inventory if product exists
                    if product:
                        size_id = cart_item.get('size_id')
                        quantity = cart_item['quantity']
                        
                        if size_id:
                            try:
                                product_size = ProductSize.objects.get(
                                    product=product,
                                    size_id=size_id
                                )
                                # We already validated stock, so we can safely decrease it
                                product_size.stock -= quantity
                                product_size.save()
                                print(f"Updated inventory for {product.name}, size ID {size_id}: new stock = {product_size.stock}")
                            except ProductSize.DoesNotExist:
                                print(f"Warning: ProductSize not found for product ID {product.id}, size ID {size_id}")
                                # Fallback to general product stock
                                product.stock -= quantity
                                product.save()
                                print(f"Updated general inventory for {product.name}: new stock = {product.stock}")
                        else:
                            # Update general product stock
                            product.stock -= quantity
                            product.save()
                            print(f"Updated general inventory for {product.name}: new stock = {product.stock}")

                # Clear the session cart if we used it
                if not items_data:
                    from cart.cart import Cart
                    cart = Cart(request)
                    cart.clear()
                    print("Session cart cleared")
            else:
                print("No items to process")

            
            # Send confirmation email after all items are created
            try:
                from orders.utils import send_order_confirmation_email
                send_order_confirmation_email(order)
            except Exception as e:
                print(f"Error sending confirmation email: {e}")
                import traceback
                print(traceback.format_exc())

        return order