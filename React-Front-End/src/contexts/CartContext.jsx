import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingAPI, setIsUsingAPI] = useState(false);

  // Helper function to handle API errors
  const handleApiError = (error, actionType) => {
    console.error(`Error during ${actionType}:`, error);
    setError(`Failed to ${actionType}. Using local storage instead.`);
    
    // When any API operation fails, switch to localStorage mode
    setIsUsingAPI(false);
    
    // Initialize from localStorage if we're switching modes after an error
    if (actionType === 'initialize cart') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  };

  // Initialize cart from localStorage or API on initial load
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Try to get cart from API first
        const response = await apiService.getCart();
        if (response.data && response.data.items) {
          setCartItems(response.data.items);
          setIsUsingAPI(true);
          console.log("Successfully initialized cart from API");
        } else {
          // Fallback to localStorage if API returns empty data
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            setCartItems(JSON.parse(savedCart));
          }
          setIsUsingAPI(false);
          console.log("API returned empty data, using localStorage");
        }
      } catch (error) {
        handleApiError(error, 'initialize cart');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCart();
  }, []);

  // Save cart to localStorage when using localStorage mode
  useEffect(() => {
    if (!isUsingAPI && !isLoading) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      console.log("Saved cart to localStorage", cartItems);
    }
  }, [cartItems, isUsingAPI, isLoading]);

  const addToCart = async (item) => {
    try {
      if (isUsingAPI) {
        // API mode
        await apiService.addToCart(
          item.product_id, 
          item.quantity, 
          true // override quantity
        );
        
        // Refresh cart after adding item
        const response = await apiService.getCart();
        if (response.data && response.data.items) {
          setCartItems(response.data.items);
          console.log("Item added to cart via API");
        }
      } else {
        // localStorage mode
        setCartItems(prevItems => {
          // Check if item already exists in cart with same ID or name+size combination
          const existingItemIndex = prevItems.findIndex(
            cartItem => (item.product_id && cartItem.product_id === item.product_id) || 
                       (!item.product_id && cartItem.name === item.name && cartItem.size === item.size)
          );

          if (existingItemIndex > -1) {
            // Update quantity if item exists
            const updatedItems = [...prevItems];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              quantity: item.quantity,
              totalPrice: item.price * item.quantity
            };
            console.log("Updated existing item in localStorage cart");
            return updatedItems;
          } else {
            // Add new item if it doesn't exist
            console.log("Added new item to localStorage cart");
            return [...prevItems, {
              ...item,
              totalPrice: item.price * item.quantity
            }];
          }
        });
      }
    } catch (error) {
      handleApiError(error, 'add item to cart');
      
      // If API fails, add to localStorage cart
      addToCart(item);
    }
  };

  const removeFromCart = async (productIdOrName, size) => {
    try {
      if (isUsingAPI && typeof productIdOrName === 'number') {
        // API mode with product_id
        await apiService.removeFromCart(productIdOrName);
        
        // Refresh cart after removing item
        const response = await apiService.getCart();
        if (response.data && response.data.items) {
          setCartItems(response.data.items);
          console.log("Item removed from cart via API");
        }
      } else {
        // localStorage mode or using name+size
        setCartItems(prevItems => {
          const filteredItems = prevItems.filter(item => 
            // Filter by product_id if it exists
            (typeof productIdOrName === 'number' && item.product_id !== productIdOrName) ||
            // Otherwise filter by name and size
            (typeof productIdOrName === 'string' && !(item.name === productIdOrName && item.size === size))
          );
          console.log("Item removed from localStorage cart");
          return filteredItems;
        });
      }
    } catch (error) {
      handleApiError(error, 'remove item from cart');
      
      // If API fails, remove from localStorage cart
      if (typeof productIdOrName === 'number') {
        setCartItems(prevItems => 
          prevItems.filter(item => item.product_id !== productIdOrName)
        );
      }
    }
  };

  const updateQuantity = async (productIdOrName, newQuantity, size) => {
    if (newQuantity < 1) return;
    
    try {
      if (isUsingAPI && typeof productIdOrName === 'number') {
        // API mode with product_id
        await apiService.addToCart(productIdOrName, newQuantity, true);
        
        // Refresh cart after updating quantity
        const response = await apiService.getCart();
        if (response.data && response.data.items) {
          setCartItems(response.data.items);
          console.log("Quantity updated via API");
        }
      } else {
        // localStorage mode or using name+size
        setCartItems(prevItems => {
          const updatedItems = prevItems.map(item => {
            // Match by product_id if it exists
            if (typeof productIdOrName === 'number' && item.product_id === productIdOrName) {
              return { 
                ...item, 
                quantity: newQuantity,
                totalPrice: item.price * newQuantity
              };
            }
            // Otherwise match by name and size
            if (typeof productIdOrName === 'string' && item.name === productIdOrName && item.size === size) {
              return { 
                ...item, 
                quantity: newQuantity,
                totalPrice: item.price * newQuantity
              };
            }
            return item;
          });
          console.log("Quantity updated in localStorage cart");
          return updatedItems;
        });
      }
    } catch (error) {
      handleApiError(error, 'update quantity');
      
      // If API fails, update in localStorage cart
      if (typeof productIdOrName === 'number') {
        setCartItems(prevItems =>
          prevItems.map(item => 
            item.product_id === productIdOrName 
              ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
              : item
          )
        );
      }
    }
  };

  const clearCart = async () => {
    try {
      if (isUsingAPI) {
        // API mode
        await apiService.clearCart();
        setCartItems([]);
        console.log("Cart cleared via API");
      } else {
        // localStorage mode
        setCartItems([]);
        console.log("Cart cleared in localStorage");
      }
    } catch (error) {
      handleApiError(error, 'clear cart');
      
      // If API fails, clear localStorage cart
      setCartItems([]);
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Handle both API and localStorage cart item formats
      if (item.total_price) {
        return total + Number(item.total_price);
      } else {
        return total + (Number(item.price) * item.quantity);
      }
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isLoading,
      error,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      isUsingAPI
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