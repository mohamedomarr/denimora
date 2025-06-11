import { useState, useEffect } from 'react';

const VISIT_COOLDOWN = 10; // Show popup again after 10 visits

export const usePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('signup');

  useEffect(() => {
    // Never show again if user has subscribed
    if (localStorage.getItem('denimora_subscribe_popup_never_show') === 'true') return;

    // Get visit count and last shown visit from localStorage
    let visitCount = parseInt(localStorage.getItem('denimora_subscribe_popup_visits') || '0', 10);
    let lastShownAt = parseInt(localStorage.getItem('denimora_subscribe_popup_last_shown') || '-1', 10);

    visitCount += 1;
    localStorage.setItem('denimora_subscribe_popup_visits', visitCount.toString());

    // Show popup if never shown, or cooldown passed
    if (lastShownAt === -1 || visitCount - lastShownAt >= VISIT_COOLDOWN) {
      setShowPopup(true);
      localStorage.setItem('denimora_subscribe_popup_last_shown', visitCount.toString());
    }
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