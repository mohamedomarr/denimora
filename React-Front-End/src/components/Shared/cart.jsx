import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useCart } from "../../contexts/CartContext";

function useCartHistory(isCartOpen, closeCart) {
  useEffect(() => {
    if (isCartOpen) {
      window.history.pushState({ cartOpen: true }, "");
      const onPopState = (e) => {
        closeCart();
      };
      window.addEventListener("popstate", onPopState);
      return () => {
        window.removeEventListener("popstate", onPopState);
        // Optionally, go forward if cart is closed by other means
        // window.history.go(1);
      };
    }
  }, [isCartOpen, closeCart]);
} 

const Cart = () => {
  const navigate = useNavigate();
  const { isCartOpen, cartRef, closeCartMenu } = useCartMenu();
  const { cartItems, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  useCartHistory(isCartOpen, closeCartMenu);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeCartMenu();
    }
  };

  // Handle clicks outside the cart (backup for edge cases)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCartOpen && cartRef.current && !cartRef.current.contains(event.target)) {
        closeCartMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, cartRef, closeCartMenu]);

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  // Cart Checkout Button
  const handleCheckoutBtn = () => {
    closeCartMenu();
    navigate("/checkout");
  };
  
  if (!isCartOpen) return null;

  return (
    <div 
      className="cart-menu-overlay" 
      onClick={handleOverlayClick}
    >
      <div
        className={`cart-menu ${isCartOpen ? "active" : ""}`}
        id="cartMenu"
        ref={cartRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close-cart" onClick={closeCartMenu}>
          &times;
        </div>
        
        <div className="cart-content">
          <h2>Your Cart</h2>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={`${item.name}-${item.size}-${index}`}
                  className="cart-item"
                >
                  <div className="cart-item-image">
                    <img 
                      src={item.image_url || item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/Assets/Shop/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    {item.size && <p>Size: {item.size}</p>}
                    <p>Price: LE {Number(item.price).toFixed(2)}</p>
                    <p>
                      Total: LE{" "}
                      {(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                    <div className="cart-item-quantity">
                      <button
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
                      <span>{item.quantity}</span>
                      <button
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
                    className="remove-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.name, item.size);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="cart-total">
            <p>
              Total: <span>LE {getTotalPrice().toFixed(2)}</span>
            </p>
            {cartItems.length > 0 && (
              <button className="checkout-btn" onClick={handleCheckoutBtn}>
                Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
