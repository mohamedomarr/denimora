import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CartMenuProvider>
          <MobileMenuProvider>
            <PopupProvider>
              <MainLayout>
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