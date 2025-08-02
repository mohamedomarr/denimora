import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import facebookPixel from './services/facebookPixel';
import Home from './components/Pages/home';
import Shop from './components/Pages/shop';
import ItemDetails from './components/Pages/itemdetails';
import Checkout from './components/Pages/Checkout';
import CartPage from './components/Pages/CartPage'; // We'll create this
import AboutUs from './components/Pages/aboutus';
import ContactUs from './components/Pages/contactus';
import PrivacyPolicy from './components/Pages/privacypolicy';
import ReturnsExchanges from './components/Pages/returns&exchanges';
import ShippingDelivery from './components/Pages/shipping&delivery';
import TermsConditions from './components/Pages/terms&conditions';
import MainLayout from './components/Layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { CartMenuProvider } from './contexts/CartMenuContext';
import { MobileMenuProvider } from './contexts/MobileMenuContext';
import { PopupProvider } from './contexts/PopupContext';
import './CSS/bootstrap.css';
import './CSS/Styles.css';

// Page tracking component for Facebook Pixel
function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Only track custom events, not PageView (base pixel handles PageView automatically)
    // We can track custom page names as custom events instead
    const pageNames = {
      '/': 'Home',
      '/shop': 'Shop',
      '/cart': 'Cart',
      '/checkout': 'Checkout',
      '/aboutus': 'About Us',
      '/contact': 'Contact Us',
      '/privacy-policy': 'Privacy Policy',
      '/returns-exchanges': 'Returns & Exchanges',
      '/shipping-delivery': 'Shipping & Delivery',
      '/terms-conditions': 'Terms & Conditions'
    };

    const pageName = pageNames[location.pathname] || 
                    (location.pathname.includes('/shop-item') ? 'Product Details' : 'Unknown Page');

    // Track as custom event instead of PageView to avoid duplication
    facebookPixel.trackCustomEvent('PageVisit', { 
      page_name: pageName,
      page_path: location.pathname 
    });

  }, [location.pathname]);

  return null; // This component doesn't render anything
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartMenuProvider>
          <MobileMenuProvider>
            <PopupProvider>
              <MainLayout>
                <PageTracker />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop-item" element={<ItemDetails />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/aboutus" element={<AboutUs />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/returns-exchanges" element={<ReturnsExchanges />} />
                  <Route path="/shipping-delivery" element={<ShippingDelivery />} />
                  <Route path="/terms-conditions" element={<TermsConditions />} />
                </Routes>
              </MainLayout>
            </PopupProvider>
          </MobileMenuProvider>
        </CartMenuProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;