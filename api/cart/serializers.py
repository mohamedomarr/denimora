from rest_framework import serializers
from products.models import Product

class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    
    def validate_product_id(self, value):
        try:
            Product.objects.get(id=value, available=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not available")

class CartAddSerializer(CartItemSerializer):
    override_quantity = serializers.BooleanField(default=False)

class CartItemDetailSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    quantity = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    image_url = serializers.CharField(read_only=True)

class CartSerializer(serializers.Serializer):
    items = CartItemDetailSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True) 