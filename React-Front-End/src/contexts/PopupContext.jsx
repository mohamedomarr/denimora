import React, { createContext, useContext, useState, useEffect } from 'react';

const PopupContext = createContext();

export const PopupProvider = ({ children }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');
  const [autoShowEnabled, setAutoShowEnabled] = useState(true);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  const VISITS_BEFORE_POPUP = 10;
  const POPUP_DELAY = 1000;

  // Check if user has already subscribed and handle visit tracking
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("denimora_subscribe_popup_never_show");
    if (hasSeenPopup) {
      setAutoShowEnabled(false);
      return;
    }

    // Increment visit count
    const currentVisitCount = parseInt(localStorage.getItem("denimora_popup_visit_count") || "0");
    const newVisitCount = currentVisitCount + 1;
    localStorage.setItem("denimora_popup_visit_count", newVisitCount.toString());

    // Check if we should enable popup
    if (newVisitCount >= VISITS_BEFORE_POPUP) {
      setAutoShowEnabled(true);
    } else {
      setAutoShowEnabled(false);
    }
  }, []);

  // Auto-show popup with delay (only once per session)
  useEffect(() => {
    if (autoShowEnabled && !showPopup && !hasShownThisSession) {
      const timer = setTimeout(() => {
        setShowPopup(true);
        setActiveTab('signup');
        setHasShownThisSession(true);
      }, POPUP_DELAY);

      return () => clearTimeout(timer);
    }
  }, [autoShowEnabled, showPopup, hasShownThisSession]);

  // Close popup function
  const closePopup = () => {
    setShowPopup(false);
    // Reset visit count when manually closed
    localStorage.setItem("denimora_popup_visit_count", "0");
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

  // Disable auto-show (when user subscribes)
  const disableAutoShow = () => {
    setAutoShowEnabled(false);
    setShowPopup(false);
    localStorage.setItem("denimora_subscribe_popup_never_show", "true");
    localStorage.removeItem("denimora_popup_visit_count");
  };

  // Enable auto-show (for testing or reset)
  const enableAutoShow = () => {
    setAutoShowEnabled(true);
    setHasShownThisSession(false);
    localStorage.removeItem("denimora_subscribe_popup_never_show");
    localStorage.removeItem("denimora_popup_visit_count");
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