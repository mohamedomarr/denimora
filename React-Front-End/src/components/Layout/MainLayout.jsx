import React, { useState, createContext, useContext } from 'react';
import { usePopup } from '../../contexts/PopupContext';
import { useCart } from '../../contexts/CartContext';
import Header from '../Shared/header';
import Footer from '../Shared/footer';
import MobileMenu from '../Shared/mobilemenu';
import Cart from '../Shared/cart';
import CartPopup from '../Shared/cartpopup';
import apiService from '../../services/api';

// Create a context for the cart popup functionality
const CartPopupContext = createContext();

export const useCartPopup = () => {
  const context = useContext(CartPopupContext);
  if (!context) {
    throw new Error('useCartPopup must be used within a MainLayout');
  }
  return context;
};

// ExpiredItemsNotification component
const ExpiredItemsNotification = () => {
  const { expiredItemsNotification, clearExpiredItemsNotification } = useCart();

  if (!expiredItemsNotification) return null;

  return (
    <div 
      className="expired-items-notification"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#ff6b6b',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10000,
        maxWidth: '400px',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            Items Removed from Cart
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            {expiredItemsNotification.message}
          </div>
        </div>
        <button
          onClick={clearExpiredItemsNotification}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

// ErrorNotification component
const ErrorNotification = () => {
  const { errorNotification, clearErrorNotification } = useCart();

  if (!errorNotification) return null;

  const getNotificationStyle = (type) => {
    const baseStyle = {
      position: 'fixed',
      top: '80px', // Position below expired items notification
      right: '20px',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10000,
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'error':
        return { ...baseStyle, backgroundColor: '#ff4757', color: 'white' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#ffa502', color: 'white' };
      case 'info':
        return { ...baseStyle, backgroundColor: '#3742fa', color: 'white' };
      default:
        return { ...baseStyle, backgroundColor: '#ff4757', color: 'white' };
    }
  };

  return (
    <div 
      className="error-notification"
      style={getNotificationStyle(errorNotification.type)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            {errorNotification.type === 'error' && '⚠️ Unable to Add Item'}
            {errorNotification.type === 'warning' && '⚠️ Warning'}
            {errorNotification.type === 'info' && 'ℹ️ Information'}
          </div>
          <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
            {errorNotification.message}
          </div>
        </div>
        <button
          onClick={clearErrorNotification}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

const MainLayout = ({ children }) => {
  const { showPopup, activeTab, closePopup, disableAutoShow } = usePopup();
  const { addToCart } = useCart();
  
  // Popup subscription state
  const [subscriptionForm, setSubscriptionForm] = useState({
    email: "",
  });
  const [subscriptionErrors, setSubscriptionErrors] = useState({
    email: "",
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Add to Cart popup state (global)
  const [showAddCartPopup, setShowAddCartPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Global cart popup handlers
  const handleCartIconClick = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setShowAddCartPopup(true);
  };

  const handleCloseAddCartPopup = () => {
    setShowAddCartPopup(false);
    setSelectedProduct(null);
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle subscription form input changes
  const handleSubscriptionInputChange = (e) => {
    const { value } = e.target;
    setSubscriptionForm({ email: value });
    setSubscriptionErrors({ email: "" });
  };

  // Handle subscription form submission
  const handleSubscription = async (e) => {
    e.preventDefault();

    if (!subscriptionForm.email.trim()) {
      setSubscriptionErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(subscriptionForm.email)) {
      setSubscriptionErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await apiService.subscribeEmail(subscriptionForm.email, 'popup');
      
      if (response.data.success) {
        setSubscriptionSuccess(true);
        setSubscriptionForm({ email: "" });
        disableAutoShow();
        
        setTimeout(() => {
          setSubscriptionSuccess(false);
          closePopup();
        }, 5000);
      } else {
        setSubscriptionErrors({
          email: response.data.error || "Failed to subscribe. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      let errorMessage = "Failed to subscribe. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setSubscriptionErrors({ email: errorMessage });
    } finally {
      setIsSubscribing(false);
    }
  };

  const cartPopupValue = {
    handleCartIconClick,
    showAddCartPopup,
    selectedProduct,
    handleCloseAddCartPopup
  };

  return (
    <CartPopupContext.Provider value={cartPopupValue}>
      {/* Header - rendered once */}
      <Header />

      {/* Main content area - different for each page */}
      <main>
        {children}
      </main>

      {/* Footer - rendered once */}
      <Footer />

      {/* Mobile Menu - rendered once */}
      <MobileMenu />

      {/* Cart Menu - rendered once */}
      <Cart />

      {/* Global Subscription Popup */}
      {showPopup && (
        <div className="popup-overlay" id="popup">
          <div className="popup-content">
            <span className="close-btn" onClick={closePopup}>
              &times;
            </span>

            <div
              className={`tab-content ${
                activeTab === "signup" ? "active" : ""
              }`}
              id="subscribe"
            >
              <h2>Subscribe Our E-mail Newsletter</h2>
              <p>Get the latest news and updates from Denimora</p>

              <form onSubmit={handleSubscription}>
                <input
                  type="email"
                  placeholder="Email Address"
                  name="email"
                  value={subscriptionForm.email}
                  onChange={handleSubscriptionInputChange}
                  className={subscriptionErrors.email ? "error" : ""}
                />
                {subscriptionErrors.email && (
                  <div className="error-message">
                    {subscriptionErrors.email}
                  </div>
                )}

                {subscriptionSuccess && (
                  <div className="success-message">
                    Thank you for subscribing to our newsletter!
                  </div>
                )}

                <button type="submit" className="btn" disabled={isSubscribing}>
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Global Add to Cart Popup */}
      <CartPopup 
        showPopup={showAddCartPopup}
        selectedProduct={selectedProduct}
        onClose={handleCloseAddCartPopup}
      />

      {/* Expired items notification */}
      <ExpiredItemsNotification />

      {/* Error notification */}
      <ErrorNotification />
    </CartPopupContext.Provider>
  );
};

export default MainLayout; 