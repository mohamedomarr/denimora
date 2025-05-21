from django.shortcuts import render
from products.models import Product

def home(request):
    try:
        # Get featured products for the home page
        featured_products = Product.objects.filter(available=True)[:4]
        
        # Make sure we have products before passing them to the template
        if not featured_products.exists():
            featured_products = []
    except:
        # If any error occurs, just set featured_products to an empty list
        featured_products = []
    
    return render(request, 'home.html', {
        'featured_products': featured_products
    })
