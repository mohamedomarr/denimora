import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Pages/home';
import Shop from './components/Pages/shop';
import ItemDetails from './components/Pages/itemdetails';
import Checkout from './components/Pages/Checkout';
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