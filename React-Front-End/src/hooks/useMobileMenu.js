import { useState, useEffect, useRef } from 'react';

export const useMobileMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          menuBtnRef.current && !menuBtnRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const openMobileMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return {
    isMenuOpen,
    menuRef,
    menuBtnRef,
    openMobileMenu,
    closeMobileMenu
  };
}; 