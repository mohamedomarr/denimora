from rest_framework import serializers
from products.models import Product, Category, Size, ProductSize, ProductImage

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']
        
class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name']

class ProductSizeSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'stock']

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text']

    def get_image_url(self, obj):
        # Use the model's image_url property which handles GitHub URLs
        return obj.image_url

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    sizes = SizeSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    detail_images = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image_url', 'description', 
                 'price', 'stock', 'available', 'category', 'sizes',
                 'created', 'updated', 'is_featured', 'detail_images']
    
    def get_image_url(self, obj):
        # Use the model's image_url property which handles GitHub URLs
        return obj.image_url

    def get_detail_images(self, obj):
        detail_images = obj.detail_images.all()
        return ProductImageSerializer(detail_images, many=True).data

    def get_available_sizes(self, obj):
        """Returns sizes that have stock available"""
        product_sizes = obj.product_sizes.filter(stock__gt=0)
        return ProductSizeSerializer(product_sizes, many=True).data