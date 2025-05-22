import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/home';
import Shop from './components/shop';
import ItemDetails from './components/itemdetails';
import Checkout from './components/Checkout';
import { CartMenuProvider } from './contexts/CartMenuContext';
import { MobileMenuProvider } from './contexts/MobileMenuContext';
import './CSS/bootstrap.css';
import './CSS/Styles.css';

function App() {
  return (
    <CartMenuProvider>
      <MobileMenuProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop-item" element={<ItemDetails />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </MobileMenuProvider>
    </CartMenuProvider>
  );
}

export default App;
