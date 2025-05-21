def cart(request):
    """
    Context processor to make cart available in all templates
    """
    from cart.cart import Cart
    return {'cart': Cart(request)}
