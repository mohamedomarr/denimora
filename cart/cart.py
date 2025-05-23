from django.db import models
from django.conf import settings
from products.models import Product, Size

class Cart:
    def __init__(self, request):
        """
        Initialize the cart.
        """
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            # save an empty cart in the session
            cart = self.session[settings.CART_SESSION_ID] = {}
        self.cart = cart
    
    def add(self, product, size_id=None, quantity=1, override_quantity=False):
        """
        Add a product to the cart or update its quantity.
        """
        product_id = str(product.id)
        
        # Create a unique key for the product+size combination
        key = product_id
        if size_id:
            key = f"{product_id}_{size_id}"
            
        if key not in self.cart:
            self.cart[key] = {
                'quantity': 0, 
                'price': str(product.price),
                'size_id': size_id
            }
            
        if override_quantity:
            self.cart[key]['quantity'] = quantity
        else:
            self.cart[key]['quantity'] += quantity
            
        self.save()
    
    def save(self):
        # mark the session as "modified" to make sure it gets saved
        self.session.modified = True
    
    def remove(self, product_id, size_id=None):
        """
        Remove a product from the cart.
        """
        key = str(product_id)
        if size_id:
            key = f"{product_id}_{size_id}"
            
        if key in self.cart:
            del self.cart[key]
            self.save()
    
    def __iter__(self):
        """
        Iterate over the items in the cart and get the products from the database.
        """
        # Get all product_ids and size_ids from cart
        product_ids = set()
        size_ids = set()
        
        for key in self.cart.keys():
            if '_' in key:
                p_id, s_id = key.split('_')
                product_ids.add(p_id)
                if s_id and s_id != 'null' and s_id != 'undefined':
                    size_ids.add(s_id)
            else:
                product_ids.add(key)
        
        # Get the product objects
        products = Product.objects.filter(id__in=product_ids)
        
        # Get the size objects if needed
        sizes = {}
        if size_ids:
            for size in Size.objects.filter(id__in=size_ids):
                sizes[str(size.id)] = size
        
        # Create a copy of the cart
        cart = self.cart.copy()
        
        # Add product and size objects to cart items
        for key, item in cart.items():
            if '_' in key:
                p_id, s_id = key.split('_')
                product = next((p for p in products if str(p.id) == p_id), None)
                if not product:
                    continue
                    
                item['product'] = product
                
                if s_id and s_id != 'null' and s_id != 'undefined' and s_id in sizes:
                    item['size'] = sizes[s_id]
                    item['size_name'] = sizes[s_id].name
            else:
                product = next((p for p in products if str(p.id) == key), None)
                if product:
                    item['product'] = product
            
            item['price'] = float(item['price'])
            item['total_price'] = item['price'] * item['quantity']
            yield item
    
    def __len__(self):
        """
        Count all items in the cart.
        """
        return sum(item['quantity'] for item in self.cart.values())
    
    def get_total_price(self):
        return sum(float(item['price']) * item['quantity'] for item in self.cart.values())
    
    def clear(self):
        # remove cart from session
        del self.session[settings.CART_SESSION_ID]
        self.save()

def cart_processor(request):
    """
    Context processor to make cart available in all templates
    """
    return {'cart': Cart(request)}
