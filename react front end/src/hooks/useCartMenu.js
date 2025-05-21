import { useState, useEffect, useRef } from 'react';

export const useCartMenu = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartRef = useRef(null);
  const cartBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target) && 
          cartBtnRef.current && !cartBtnRef.current.contains(event.target)) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const openCartMenu = () => {
    setIsCartOpen(true);
  };

  const closeCartMenu = () => {
    setIsCartOpen(false);
  };

  return {
    isCartOpen,
    cartRef,
    cartBtnRef,
    openCartMenu,
    closeCartMenu
  };
}; 