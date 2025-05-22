import React, { createContext, useContext, useRef, useState } from 'react';

const MobileMenuContext = createContext();

export const MobileMenuProvider = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuBtnRef = useRef(null);

  const openMobileMenu = () => {
    setIsMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <MobileMenuContext.Provider value={{
      isMenuOpen,
      menuRef,
      menuBtnRef,
      openMobileMenu,
      closeMobileMenu
    }}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within a MobileMenuProvider');
  }
  return context;
}; 