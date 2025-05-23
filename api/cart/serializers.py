from rest_framework import serializers
from products.models import Product, Size

class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    size_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_product_id(self, value):
        try:
            Product.objects.get(id=value, available=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not available")
            
    def validate_size_id(self, value):
        if value is None:
            return None
            
        try:
            Size.objects.get(id=value)
            return value
        except Size.DoesNotExist:
            raise serializers.ValidationError("Size not available")

class CartAddSerializer(CartItemSerializer):
    override_quantity = serializers.BooleanField(default=False)

class CartItemDetailSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    name = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    quantity = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    image_url = serializers.CharField(read_only=True)
    size_id = serializers.IntegerField(read_only=True, allow_null=True)
    size_name = serializers.CharField(read_only=True, allow_null=True)

class CartSerializer(serializers.Serializer):
    items = CartItemDetailSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True) 