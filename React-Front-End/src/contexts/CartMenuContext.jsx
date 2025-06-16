import React, { createContext, useContext, useRef, useState } from 'react';

const CartMenuContext = createContext();

export const CartMenuProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef(null);
  const cartBtnRef = useRef(null);

  const openCartMenu = () => {
    setIsCartOpen(true);
  };

  const closeCartMenu = () => {
    setIsCartOpen(false);
  };


 

  return (
    <CartMenuContext.Provider value={{
      isCartOpen,
      cartRef,
      cartBtnRef,
      openCartMenu,
      closeCartMenu,
      
    }}>
      {children}
    </CartMenuContext.Provider>
  );
};

export const useCartMenu = () => {
  const context = useContext(CartMenuContext);
  if (!context) {
    throw new Error('useCartMenu must be used within a CartMenuProvider');
  }
  return context;
}; 