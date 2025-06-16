import React, { createContext, useContext, useState, useEffect } from 'react';

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const [autoShowEnabled, setAutoShowEnabled] = useState(true);

  // Check if user has already seen the popup
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("denimora_subscribe_popup_never_show");
    if (hasSeenPopup) {
      setAutoShowEnabled(false);
    }
  }, []);

  // Auto-show popup functionality
  useEffect(() => {
    if (autoShowEnabled && !showPopup) {
      // Show popup after 3 seconds delay
      const timer = setTimeout(() => {
        setShowPopup(true);
        setActiveTab('signup');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoShowEnabled, showPopup]);

  // Close popup function
  const closePopup = () => {
    setShowPopup(false);
  };

  // Show specific tab function
  const showTab = (tabName = 'signup') => {
    setActiveTab(tabName);
    setShowPopup(true);
  };

  // Open popup function
  const openPopup = (tabName = 'signup') => {
    setActiveTab(tabName);
    setShowPopup(true);
  };

  // Disable auto-show (when user subscribes or dismisses)
  const disableAutoShow = () => {
    setAutoShowEnabled(false);
    localStorage.setItem("denimora_subscribe_popup_never_show", "true");
  };

  // Enable auto-show (if needed for testing or reset)
  const enableAutoShow = () => {
    setAutoShowEnabled(true);
    localStorage.removeItem("denimora_subscribe_popup_never_show");
  };

  // Toggle popup visibility
  const togglePopup = () => {
    setShowPopup(prev => !prev);
  };

  const value = {
    // State
    showPopup,
    activeTab,
    autoShowEnabled,
    
    // Actions
    closePopup,
    openPopup,
    showTab,
    togglePopup,
    disableAutoShow,
    enableAutoShow,
    
    
    setShowPopup,
    setActiveTab
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
}; 