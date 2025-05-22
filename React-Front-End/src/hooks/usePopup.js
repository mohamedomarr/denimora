import { useState, useEffect } from 'react';

export const usePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');

  useEffect(() => {
    // Show popup immediately when component mounts
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