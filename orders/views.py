from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import OrderItem, Order
from .forms import OrderCreateForm
from cart.cart import Cart
from products.models import Product

def order_create(request):
    cart = Cart(request)
    if len(cart) == 0:
        messages.error(request, 'Your cart is empty.')
        return redirect('cart:cart_detail')
    
    if request.method == 'POST':
        form = OrderCreateForm(request.POST, user=request.user if request.user.is_authenticated else None)
        if form.is_valid():
            order = form.save(commit=False)
            if request.user.is_authenticated:
                order.user = request.user
            order.save()
            
            for item in cart:
                OrderItem.objects.create(
                    order=order,
                    product=item['product'],
                    price=item['price'],
                    quantity=item['quantity']
                )
            
            # Clear the cart
            cart.clear()
            
            # Store order in session
            request.session['order_id'] = order.id
            
            messages.success(request, 'Order placed successfully!')
            return render(request, 'orders/order_created.html', {'order': order})
    else:
        form = OrderCreateForm(user=request.user if request.user.is_authenticated else None)
    
    return render(request, 'orders/order_create.html', {
        'cart': cart,
        'form': form
    })

@login_required
def order_history(request):
    orders = Order.objects.filter(user=request.user)
    return render(request, 'orders/order_history.html', {'orders': orders})

@login_required
def order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    return render(request, 'orders/order_detail.html', {'order': order})
