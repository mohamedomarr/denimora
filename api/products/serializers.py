from rest_framework import serializers
from products.models import Product, Category, Size, ProductSize

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']
        
class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'order']

class ProductSizeSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'stock']

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)
    available_sizes = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'category', 'name', 'slug', 'image', 'description', 
                 'price', 'stock', 'available', 'image_url', 'sizes', 'available_sizes',
                 'created', 'updated', 'is_featured']
    
    def get_available_sizes(self, obj):
        """Returns sizes that have stock available"""
        product_sizes = obj.product_sizes.filter(stock__gt=0)
        return ProductSizeSerializer(product_sizes, many=True).data 