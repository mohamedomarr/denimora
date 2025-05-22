from django.shortcuts import render
from products.models import Product

def home(request):
    # Get featured products for the home page
    featured_products = Product.objects.filter(available=True)[:4]
    
    return render(request, 'home.html', {
        'featured_products': featured_products
    })
