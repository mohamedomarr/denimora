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

  // Initialize cart from localStorage on initial load
  useEffect(() => {
    console.log("Initializing cart...");

    // Always initialize from localStorage for reliability
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log("Loaded cart from localStorage:", parsedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
        // If there's an error parsing the cart, start with an empty cart
        setCartItems([]);
        localStorage.setItem('cart', JSON.stringify([]));
      }
    } else {
      console.log("No cart found in localStorage, starting with empty cart");
      setCartItems([]);
    }

    // Disable API mode for now to ensure functionality
    setIsUsingAPI(false);
    setIsLoading(false);

    // We'll keep this code commented out for future reference
    // when we want to re-enable API mode
    /*
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
    */
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      console.log("Saved cart to localStorage:", cartItems);
    }
  }, [cartItems, isLoading]);

  const addToCart = (item) => {
    console.log("CartContext: addToCart called with item:", item);

    // Ensure we have the required fields
    if (!item || (!item.name && !item.product_id)) {
      console.error("Invalid item data:", item);
      return;
    }

    // Always use localStorage mode for now to ensure functionality
    // We can re-enable API mode once the basic functionality works
    const useLocalStorage = true; // Force localStorage mode for reliability

    if (!useLocalStorage && isUsingAPI && item.product_id) {
      // API mode implementation (disabled for now)
      console.log("API mode is currently disabled for reliability");
    }

    // Use synchronous localStorage update to ensure immediate UI feedback
    setCartItems(prevItems => {
      console.log("Current cart items:", prevItems);

      // Check if item already exists in cart with same ID or name+size combination
      const existingItemIndex = prevItems.findIndex(
        cartItem => {
          // Match by product_id if both items have it
          if (item.product_id && cartItem.product_id) {
            return cartItem.product_id === item.product_id &&
                  (item.size_id ? cartItem.size_id === item.size_id : cartItem.size === item.size);
          }
          // Otherwise match by name and size
          return cartItem.name === item.name && cartItem.size === item.size;
        }
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        };
        console.log("Updated existing item in cart:", updatedItems[existingItemIndex]);
        return updatedItems;
      } else {
        // Add new item if it doesn't exist
        const newItem = {
          ...item,
          totalPrice: item.price * item.quantity
        };
        console.log("Added new item to cart:", newItem);
        return [...prevItems, newItem];
      }
    });

    // Save to localStorage immediately
    setTimeout(() => {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
      console.log("Current localStorage cart:", currentCart);
    }, 100);
  };

  const removeFromCart = (productIdOrName, size) => {
    console.log("CartContext: removeFromCart called with:", productIdOrName, size);

    // Use synchronous localStorage update for reliability
    setCartItems(prevItems => {
      const filteredItems = prevItems.filter(item => {
        if (typeof productIdOrName === 'number') {
          // If we're looking for a product by ID
          if (size) {
            // If size is provided, match both product_id and size_id
            return !(item.product_id === productIdOrName && item.size_id === size);
          }
          // Otherwise just match by product_id
          return item.product_id !== productIdOrName;
        } else {
          // If we're looking for a product by name
          return !(item.name === productIdOrName && item.size === size);
        }
      });
      console.log("Item removed from cart, remaining items:", filteredItems);
      return filteredItems;
    });
  };

  const updateQuantity = (productIdOrName, size, newQuantity) => {
    console.log("CartContext: updateQuantity called with:", productIdOrName, size, newQuantity);

    if (newQuantity < 1) {
      console.log("Quantity must be at least 1, ignoring update");
      return;
    }

    // Use synchronous localStorage update for reliability
    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        // Match by product_id if both have it
        if (typeof productIdOrName === 'number' && item.product_id === productIdOrName) {
          // If size is provided, match both product_id and size_id
          if (size && item.size_id !== size) {
            return item;
          }
          console.log(`Updating quantity for item with product_id ${productIdOrName} to ${newQuantity}`);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.price * newQuantity
          };
        }
        // Otherwise match by name and size
        if (typeof productIdOrName === 'string' && item.name === productIdOrName && item.size === size) {
          console.log(`Updating quantity for item "${item.name}" (size: ${size}) to ${newQuantity}`);
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.price * newQuantity
          };
        }
        return item;
      });
      return updatedItems;
    });
  };

  const clearCart = () => {
    console.log("CartContext: clearCart called");
    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
    console.log("Cart cleared");
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