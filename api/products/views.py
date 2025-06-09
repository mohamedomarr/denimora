from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from products.models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    """
    List all available products or filter by category or is_featured
    """
    category_slug = request.query_params.get('category', None)
    is_featured = request.query_params.get('is_featured', None)

    products = Product.objects.filter(available=True)

    if category_slug:
        try:
            category = Category.objects.get(slug=category_slug)
            products = products.filter(category=category)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)

    if is_featured is not None:
        products = products.filter(is_featured=is_featured.lower() == 'true')

    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def product_detail(request, id, slug):
    """
    Retrieve a specific product
    """
    try:
        product = Product.objects.get(id=id, slug=slug, available=True)
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    """
    List all product categories
    """
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)