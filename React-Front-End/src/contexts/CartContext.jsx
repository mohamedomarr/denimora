import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiService from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingAPI, setIsUsingAPI] = useState(false);
  const [stockWarnings, setStockWarnings] = useState([]);
  const [expiredItemsNotification, setExpiredItemsNotification] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);
  
  // Ref to track notification timeout
  const notificationTimeoutRef = useRef(null);
  const errorNotificationTimeoutRef = useRef(null);

  // Get or create session ID for reservations
  const getSessionId = () => {
    return apiService.getSessionId();
  };

  // Show notification for expired items
  const showExpiredItemsNotification = (expiredItems) => {
    const itemNames = expiredItems.map(item => 
      `${item.name}${item.size ? ` (${item.size})` : ''}`
    ).join(', ');

    setExpiredItemsNotification({
      message: `Some items were removed from your cart: ${itemNames}. Try to add your items again`,
      items: expiredItems
    });

    // Clear notification after 8 seconds
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(() => {
      setExpiredItemsNotification(null);
    }, 8000);
  };

  // Clear expired items notification
  const clearExpiredItemsNotification = () => {
    setExpiredItemsNotification(null);
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
  };

  // Show error notification for add to cart failures
  const showErrorNotification = (message, type = 'error') => {
    setErrorNotification({
      message,
      type, // 'error', 'warning', 'info'
      timestamp: Date.now()
    });

    // Clear notification after 6 seconds
    if (errorNotificationTimeoutRef.current) {
      clearTimeout(errorNotificationTimeoutRef.current);
    }
    errorNotificationTimeoutRef.current = setTimeout(() => {
      setErrorNotification(null);
    }, 6000);
  };

  // Clear error notification
  const clearErrorNotification = () => {
    setErrorNotification(null);
    if (errorNotificationTimeoutRef.current) {
      clearTimeout(errorNotificationTimeoutRef.current);
      errorNotificationTimeoutRef.current = null;
    }
  };

  // Initialize cart and determine if API is available
  useEffect(() => {
    console.log("Initializing cart...");

    const initializeCart = async () => {
      try {
        // Try API first
        await apiService.checkHealth();
        console.log("API is available, using aggressive 1-minute reservation system");
        setIsUsingAPI(true);
        
        // Load from localStorage as initial state, will sync with API reservations
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
        }
        
      } catch (error) {
        console.log("API unavailable, using localStorage only");
        setIsUsingAPI(false);
        
        // Load from localStorage
        try {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
          }
        } catch (parseError) {
          console.error("Error loading cart from localStorage:", parseError);
          setCartItems([]);
          localStorage.setItem('cart', JSON.stringify([]));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeCart();
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        console.log("Cart saved to localStorage:", cartItems);
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
      }
    }
  }, [cartItems, isLoading]);

  // Aggressive stock validation with automatic cleanup (every 30 seconds)
  useEffect(() => {
    if (!isUsingAPI || cartItems.length === 0) return;

    const validateAndCleanupCart = async () => {
      try {
        // Prepare cart items with reservation IDs for validation
        const itemsForValidation = cartItems.map(item => ({
          product_id: item.product_id,
          size_id: item.size_id,
          quantity: item.quantity,
          reservation_id: item.reservation_id
        }));

        const response = await apiService.validateCartStock(itemsForValidation);
        
        // Only remove items if they're actually taken by others (not just expired)
        if (response.data.expired_items && response.data.expired_items.length > 0) {
          console.log("Found items taken by others, removing from cart:", response.data.expired_items);
          
          // Remove only items that are expired AND taken by others
          const takenProductIds = response.data.expired_items.map(item => item.product_id);
          setCartItems(prevItems => 
            prevItems.filter(item => !takenProductIds.includes(item.product_id))
          );

          // Show notification to user about items taken by others
          showExpiredItemsNotification(response.data.expired_items);
        }

        // Update stock warnings for items with low availability
        if (response.data.items) {
          const warnings = response.data.items.filter(item => !item.is_available);
          setStockWarnings(warnings);
        }
      } catch (error) {
        console.error('Stock validation failed:', error);
      }
    };

    // Validate stock every 30 seconds (aggressive monitoring)
    const interval = setInterval(validateAndCleanupCart, 30000);
    
    // Also validate immediately
    validateAndCleanupCart();

    return () => clearInterval(interval);
  }, [cartItems, isUsingAPI]);

  // Auto cleanup expired reservations (every 2 minutes)
  useEffect(() => {
    if (!isUsingAPI) return;

    const cleanup = async () => {
      try {
        await apiService.cleanupExpiredReservations();
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    };

    // Cleanup every 2 minutes
    const interval = setInterval(cleanup, 120000);
    return () => clearInterval(interval);
  }, [isUsingAPI]);

  // Add item to cart with reservation
  const addToCart = async (item) => {
    console.log("Adding item to cart:", item);

    // Validate item data
    if (!item || (!item.name && !item.product_id)) {
      console.error("Invalid item data:", item);
      return false;
    }

    // Try API reservation first if available
    if (isUsingAPI && item.product_id) {
      try {
        const reservation = await apiService.reserveItem(
          item.product_id,
          item.size_id,
          item.quantity || 1,
          getSessionId()
        );

        if (reservation.data.success) {
          console.log("Item reserved successfully (1 min expiry):", reservation.data);
          
          // Add to local cart with reservation info
          const newItem = {
            id: item.product_id || `${item.name}_${item.size}_${Date.now()}`,
            product_id: item.product_id,
            name: item.name,
            price: parseFloat(item.price) || 0,
            size: item.size,
            size_id: item.size_id,
            quantity: item.quantity || 1,
            image: item.image || item.image_url,
            image_url: item.image_url || item.image,
            reservation_id: reservation.data.reservation_id,
            reserved_until: reservation.data.expires_at,
            totalPrice: (parseFloat(item.price) || 0) * (item.quantity || 1)
          };

          setCartItems(prevItems => {
            // Check if item already exists
            const existingIndex = prevItems.findIndex(cartItem =>
              cartItem.product_id === item.product_id && cartItem.size === item.size
            );

            if (existingIndex > -1) {
              // Update existing item
              const updatedItems = [...prevItems];
              updatedItems[existingIndex] = newItem;
              return updatedItems;
            } else {
              // Add new item
              return [...prevItems, newItem];
            }
          });

          return true;
        }
      } catch (error) {
        console.error("Reservation failed:", error);
        console.log("Full error response data:", error.response?.data);
        console.log("Error type:", error.response?.data?.error);
        console.log("Available count:", error.response?.data?.available);
        console.log("Error message:", error.response?.data?.message);
        
        if (error.response?.data?.error === 'insufficient_stock') {
          // Create detailed error message based on what info we have
          const errorData = error.response.data;
          const itemName = item.name || 'this item';
          const sizeText = item.size ? ` in size "${item.size}"` : '';
          const requestedQty = item.quantity || 1;
          
          // Check if this is due to reservations vs actual stock shortage
          if (errorData.message && (
            errorData.message.includes('reserved') || 
            errorData.message.includes('temporarily unavailable') ||
            errorData.message.includes('currently reserved')
          )) {
            // Item is currently reserved by another user
            throw new Error('Failed to add this item! Try again in few minutes.');
          } else if (errorData.available !== undefined) {
            // We have available stock information
            if (errorData.total_stock !== undefined && errorData.available === 0 && errorData.total_stock > 0) {
              // There is total stock but 0 available - likely due to reservations
              throw new Error('Failed to add this item! Try again in few minutes.');
            } else {
              // This is actual insufficient stock (requested > total available)
              throw new Error(`Insufficient stock for "${itemName}"${sizeText}. Requested ${requestedQty}, Available ${errorData.available}.`);
            }
          } else {
            // No specific stock info - check if this looks like a quantity issue
            if (requestedQty > 1) {
              // User requested multiple items, likely a stock issue
              throw new Error(`Insufficient stock for "${itemName}"${sizeText}.`);
            } else {
              // Single item request failed, likely reservation issue
              throw new Error('Failed to add this item! Try again in few minutes.');
            }
          }
        }
        
        // Check for other specific error types
        if (error.response?.data?.error === 'item_reserved') {
          throw new Error('Failed to add this item! Try again in few minutes.');
        }
        
        // Fall back to localStorage mode for other errors
        setIsUsingAPI(false);
        console.log("Falling back to localStorage mode");
      }
    }

    // LocalStorage fallback (original implementation)
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(cartItem => {
        if (item.product_id && cartItem.product_id) {
          return cartItem.product_id === item.product_id && cartItem.size === item.size;
        }
        return cartItem.name === item.name && cartItem.size === item.size;
      });

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = (existingItem.quantity || 1) + (item.quantity || 1);
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          totalPrice: existingItem.price * newQuantity
        };
        
        return updatedItems;
      } else {
        const newItem = {
          id: item.product_id || `${item.name}_${item.size}_${Date.now()}`,
          product_id: item.product_id,
          name: item.name,
          price: parseFloat(item.price) || 0,
          size: item.size,
          size_id: item.size_id,
          quantity: item.quantity || 1,
          image: item.image || item.image_url,
          image_url: item.image_url || item.image,
          totalPrice: (parseFloat(item.price) || 0) * (item.quantity || 1)
        };
        
        return [...prevItems, newItem];
      }
    });

    return true;
  };

  // Remove item from cart and release reservation
  const removeFromCart = async (productIdOrName, size = null) => {
    console.log("Removing item from cart:", productIdOrName, size);

    // Find the item to remove
    const itemToRemove = cartItems.find(item => {
      if (typeof productIdOrName === 'number') {
        return item.product_id === productIdOrName && 
               (size ? item.size === size : true);
      } else {
        return item.name === productIdOrName && 
               (size ? item.size === size : true);
      }
    });

    // Release reservation if using API
    if (isUsingAPI && itemToRemove?.reservation_id) {
      try {
        await apiService.releaseReservation(itemToRemove.reservation_id);
        console.log("Reservation released successfully");
      } catch (error) {
        console.error("Failed to release reservation:", error);
      }
    }

    // Remove from local cart
    setCartItems(prevItems => {
      return prevItems.filter(item => {
        if (typeof productIdOrName === 'number') {
          if (size) {
            return !(item.product_id === productIdOrName && item.size === size);
          }
          return item.product_id !== productIdOrName;
        } else {
          if (size) {
            return !(item.name === productIdOrName && item.size === size);
          }
          return item.name !== productIdOrName;
        }
      });
    });
  };

  // Update item quantity (release old reservation, create new one)
  const updateQuantity = async (productIdOrName, size, newQuantity) => {
    console.log("Updating quantity:", productIdOrName, size, newQuantity);

    if (newQuantity < 1) {
      console.log("Quantity must be at least 1");
      return;
    }

    // Find the item to update
    const itemToUpdate = cartItems.find(item => {
      if (typeof productIdOrName === 'number') {
        return item.product_id === productIdOrName && 
               (size ? item.size === size : true);
      } else {
        return item.name === productIdOrName && 
               (size ? item.size === size : true);
      }
    });

    if (!itemToUpdate) return;

    // If using API, update reservation
    if (isUsingAPI && itemToUpdate.reservation_id && itemToUpdate.product_id) {
      try {
        // Release old reservation
        await apiService.releaseReservation(itemToUpdate.reservation_id);
        
        // Create new reservation with updated quantity
        const newReservation = await apiService.reserveItem(
          itemToUpdate.product_id,
          itemToUpdate.size_id,
          newQuantity,
          getSessionId()
        );

        if (newReservation.data.success) {
          // Update local item with new reservation info
          setCartItems(prevItems => {
            return prevItems.map(item => {
              if (item === itemToUpdate) {
                return {
                  ...item,
                  quantity: newQuantity,
                  reservation_id: newReservation.data.reservation_id,
                  reserved_until: newReservation.data.expires_at,
                  totalPrice: item.price * newQuantity
                };
              }
              return item;
            });
          });
          return;
        }
      } catch (error) {
        console.error("Failed to update reservation:", error);
        setIsUsingAPI(false);
      }
    }

    // LocalStorage fallback update
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (typeof productIdOrName === 'number' && item.product_id === productIdOrName) {
          if (size && item.size !== size) return item;
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.price * newQuantity
          };
        }
        
        if (typeof productIdOrName === 'string' && item.name === productIdOrName && item.size === size) {
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: item.price * newQuantity
          };
        }
        
        return item;
      });
    });
  };

  // Clear entire cart and release all reservations
  const clearCart = async () => {
    console.log("Clearing cart");

    // Release all reservations if using API
    if (isUsingAPI) {
      const releasePromises = cartItems
        .filter(item => item.reservation_id)
        .map(item => apiService.releaseReservation(item.reservation_id));

      try {
        await Promise.all(releasePromises);
        console.log("All reservations released");
      } catch (error) {
        console.error("Failed to release some reservations:", error);
      }
    }

    setCartItems([]);
    localStorage.setItem('cart', JSON.stringify([]));
  };

  // Validate cart before checkout (prevent expired reservations)
  const validateCartBeforeCheckout = async () => {
    if (!isUsingAPI) return { success: true, items: cartItems };

    try {
      // Prepare cart items for validation
      const itemsForValidation = cartItems.map(item => ({
        product_id: item.product_id,
        size_id: item.size_id,
        quantity: item.quantity,
        reservation_id: item.reservation_id
      }));

      const response = await apiService.validateCheckout(itemsForValidation);
      
      if (!response.data.success && response.data.redirect_to_home) {
        // Clear cart of expired items that were taken by others
        if (response.data.expired_items && response.data.expired_items.length > 0) {
          const expiredProductIds = response.data.expired_items.map(item => item.product_id);
          setCartItems(prevItems => 
            prevItems.filter(item => !expiredProductIds.includes(item.product_id))
          );
        }
        
        return {
          success: false,
          shouldRedirectToHome: true,
          message: response.data.message,
          expiredItems: response.data.expired_items || []
        };
      }

      // Handle renewed reservations - update cart items with new reservation info
      if (response.data.renewed_reservations && response.data.renewed_reservations.length > 0) {
        console.log("Updating cart with renewed reservations:", response.data.renewed_reservations);
        
        setCartItems(prevItems => {
          return prevItems.map(item => {
            const renewedReservation = response.data.renewed_reservations.find(
              renewal => renewal.product_id === item.product_id
            );
            
            if (renewedReservation) {
              return {
                ...item,
                reservation_id: renewedReservation.reservation_id,
                reserved_until: renewedReservation.expires_at
              };
            }
            
            return item;
          });
        });
      }

      return response.data;
    } catch (error) {
      console.error("Checkout validation failed:", error);
      return { success: false, error: "Unable to validate cart for checkout" };
    }
  };

  // Get total price
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Get total items
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  };

  // Check if item is in cart
  const isInCart = (productIdOrName, size = null) => {
    return cartItems.some(item => {
      if (typeof productIdOrName === 'number') {
        return item.product_id === productIdOrName && 
               (size ? item.size === size : true);
      }
      return item.name === productIdOrName && 
             (size ? item.size === size : true);
    });
  };

  // Get stock warning for specific item
  const getStockWarning = (productId, size = null) => {
    return stockWarnings.find(warning => 
      warning.product_id === productId && 
      (size ? warning.size_name === size : true)
    );
  };

  const value = {
    // State
    cartItems,
    isLoading,
    error,
    isUsingAPI,
    stockWarnings,
    expiredItemsNotification,
    errorNotification,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    validateCartBeforeCheckout,
    clearExpiredItemsNotification,
    clearErrorNotification,
    showErrorNotification,
    
    // Getters
    getTotalPrice,
    getTotalItems,
    isInCart,
    getStockWarning,
    
    // Utilities
    getSessionId
  };

  return (
    <CartContext.Provider value={value}>
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
