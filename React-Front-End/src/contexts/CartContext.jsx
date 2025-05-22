import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage if available
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart with same size
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.name === item.name && cartItem.size === item.size
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        };
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        return [...prevItems, {
          ...item,
          totalPrice: item.price * item.quantity
        }];
      }
    });
  };

  const removeFromCart = (itemName, size) => {
    setCartItems(prevItems => 
      prevItems.filter(item => !(item.name === itemName && item.size === size))
    );
  };

  const updateQuantity = (itemName, size, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.name === itemName && item.size === size
          ? { 
              ...item, 
              quantity: newQuantity,
              totalPrice: item.price * newQuantity
            }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 