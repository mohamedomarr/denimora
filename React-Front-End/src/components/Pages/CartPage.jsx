import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import '../../CSS/Styles.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle checkout button
  const handleCheckoutBtn = () => {
    navigate("/checkout");
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigate("/shop");
  };

  return (
    <div className="cart-page">
      <div className="cart-page-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart-page">
            <div className="empty-cart-icon">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some items to get started!</p>
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-page">
              {cartItems.map((item, index) => (
                <div
                  key={`${item.name}-${item.size}-${index}`}
                  className="cart-item-page"
                >
                  <div className="cart-item-image-page">
                    <img 
                      src={item.image_url || item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/Assets/Shop/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="cart-item-details-page">
                    <h3>{item.name}</h3>
                    {item.size && <p className="item-size">Size: {item.size}</p>}
                    <p className="item-price">LE {Number(item.price).toFixed(2)}</p>
                    <p className="item-total">
                      Total: LE {(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <div className="cart-item-quantity-page">
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          updateQuantity(
                            item.name,
                            item.size,
                            item.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        className="quantity-btn"
                        onClick={() =>
                          updateQuantity(
                            item.name,
                            item.size,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove-item-page"
                    onClick={() => removeFromCart(item.name, item.size)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary-page">
              <div className="cart-total-page">
                <h3>Order Summary</h3>
                <div className="total-line">
                  <span>Subtotal ({cartItems.reduce((total, item) => total + item.quantity, 0)} items)</span>
                  <span>LE {getTotalPrice().toFixed(2)}</span>
                </div>
                <p className="shipping-text">Shipping will be calculated at checkout</p>
              </div>
              
              <div className="cart-actions-page">
                <button className="continue-shopping-btn" onClick={handleContinueShopping}>
                  Continue Shopping
                </button>
                <button className="checkout-btn-page" onClick={handleCheckoutBtn}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPage;
