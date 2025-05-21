import { useState, useEffect } from 'react';

export const usePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  useEffect(() => {
    // Show popup automatically on component mount
    setShowPopup(true);
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  const showTab = (tab) => {
    setActiveTab(tab);
  };

  return {
    showPopup,
    activeTab,
    closePopup,
    showTab
  };
}; 