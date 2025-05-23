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

    class Meta:
        model = Order
        fields = ['id', 'user', 'first_name', 'last_name', 'email', 'address', 'city',
                  'postal_code', 'phone', 'created', 'updated', 'status', 'status_display',
                  'paid', 'items', 'total_cost']
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

    class Meta:
        model = Order
        fields = ['first_name', 'last_name', 'email', 'address', 'city', 'postal_code', 'phone', 'items']

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request.user.is_authenticated else None
        items_data = validated_data.pop('items', [])

        # Import the custom exception
        from orders.exceptions import InsufficientStockError
        from products.models import Product, ProductSize
        from django.db import transaction

        # First, validate stock for all items before creating the order
        if items_data:
            print(f"Validating stock for {len(items_data)} items")
            for item_data in items_data:
                product_id = item_data.get('product_id')
                if not product_id:
                    continue  # Skip validation for custom items without product_id

                try:
                    product = Product.objects.get(id=product_id)
                    quantity = item_data['quantity']
                    size_id = item_data.get('size_id')
                    size_name = item_data.get('size')

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

        # Use transaction to ensure all operations succeed or fail together
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=user,
                **validated_data
            )

            # Process items from the request data
            if items_data:
                print(f"Creating order items from request data: {len(items_data)} items")
                for item_data in items_data:
                    product_id = item_data.get('product_id')
                    product = None

                    if product_id:
                        try:
                            product = Product.objects.get(id=product_id)
                        except Product.DoesNotExist:
                            print(f"Product with ID {product_id} not found")

                    # Create the order item with size information
                    OrderItem.objects.create(
                        order=order,
                        product=product,  # Can be None for custom items
                        price=item_data['price'],
                        quantity=item_data['quantity'],
                        size_name=item_data.get('size'),
                        size_id=item_data.get('size_id')
                    )

                    # Update inventory if product and size_id exist
                    if product and item_data.get('size_id'):
                        try:
                            product_size = ProductSize.objects.get(
                                product=product,
                                size_id=item_data.get('size_id')
                            )
                            # We already validated stock, so we can safely decrease it
                            product_size.stock -= item_data['quantity']
                            product_size.save()
                            print(f"Updated inventory for {product.name}, size ID {item_data.get('size_id')}: new stock = {product_size.stock}")
                        except ProductSize.DoesNotExist:
                            print(f"Warning: ProductSize not found for product ID {product.id}, size ID {item_data.get('size_id')}")
                    # Also update the general product stock as a fallback
                    elif product:
                        # We already validated stock, so we can safely decrease it
                        product.stock -= item_data['quantity']
                        product.save()
                        print(f"Updated general inventory for {product.name}: new stock = {product.stock}")

            return order

        # Fallback to session cart if no items in request
        print("No items in request data, checking session cart")
        from cart.cart import Cart
        cart = Cart(request)

        # First, validate stock for all items in the cart
        if len(cart) > 0:
            print(f"Validating stock for {len(cart)} items in session cart")
            for item in cart:
                product = item['product']
                quantity = item['quantity']
                size_id = None
                size_name = None

                # Extract size information
                if 'size' in item and hasattr(item['size'], 'id'):
                    size_id = item['size'].id
                    size_name = item['size'].name
                elif 'size_id' in item:
                    size_id = item['size_id']
                    size_name = item.get('size_name', None)

                # Check stock for product with specific size
                if product and size_id:
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
                elif product and product.stock < quantity:
                    raise InsufficientStockError(
                        product.name,
                        None,
                        quantity,
                        product.stock
                    )

        # Use transaction to ensure all operations succeed or fail together
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=user,
                **validated_data
            )

            if len(cart) > 0:
                print(f"Creating order items from session cart: {len(cart)} items")
                for item in cart:
                    # Extract size information from cart item
                    size_name = item.get('size_name', None)
                    size_id = None

                    # Try to get size_id from different possible structures
                    if 'size' in item and hasattr(item['size'], 'id'):
                        size_id = item['size'].id
                        size_name = item['size'].name
                    elif 'size_id' in item:
                        size_id = item['size_id']

                    # Create order item with size information
                    OrderItem.objects.create(
                        order=order,
                        product=item['product'],
                        price=item['price'],
                        quantity=item['quantity'],
                        size_name=size_name,
                        size_id=size_id
                    )

                    # Update inventory if product and size_id exist
                    product = item['product']
                    if product and size_id:
                        try:
                            product_size = ProductSize.objects.get(
                                product=product,
                                size_id=size_id
                            )
                            # We already validated stock, so we can safely decrease it
                            product_size.stock -= item['quantity']
                            product_size.save()
                            print(f"Updated inventory for {product.name}, size ID {size_id}: new stock = {product_size.stock}")
                        except ProductSize.DoesNotExist:
                            print(f"Warning: ProductSize not found for product ID {product.id}, size ID {size_id}")
                    # Also update the general product stock as a fallback
                    elif product:
                        # We already validated stock, so we can safely decrease it
                        product.stock -= item['quantity']
                        product.save()
                        print(f"Updated general inventory for {product.name}: new stock = {product.stock}")

                # Clear the cart
                cart.clear()
            else:
                print("No items in session cart either")

        return order