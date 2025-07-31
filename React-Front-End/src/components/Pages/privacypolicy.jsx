import React, { useEffect } from 'react';

const PrivacyPolicy = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-policy-page">
      <div className="privacy-page-container">
        
        {/* Page Title */}
        <div className="privacy-page-header">
          <h1>Privacy Policy</h1>
        </div>

        {/* Main Content */}
        <div className="privacy-page-content">
          
          {/* Introduction Section */}
          <div className="privacy-section">
            <p>
              At Denimora, we are committed to protecting the privacy and security of our customers. This Privacy 
              Policy explains how we collect, use, and share information about you when you visit or make a 
              purchase from our website <a href="https://denimora.co" style={{textDecoration: 'underline', color: 'var(--Gold--)'}}>Denimora.co</a>.
            </p>
            <p>
              By using the Site, you agree to the collection, use, and sharing of your information as described in 
              this Privacy Policy. If you do not agree with our policies and practices, do not use the Site.
            </p>
            <p>
              We reserve the right to change our Privacy Policy at any time. We encourage you to review the 
              Privacy Policy whenever you access the Site or provide personal information to us.
            </p>
          </div>

          {/* Information We Collect Section */}
          <div className="privacy-section">
            <h2>Information We Collect</h2>
            <p>
              We collect information about you when you use the Site, including when you make a purchase, 
              create an account, or sign up for our newsletter.
            </p>
            <p>The types of information we collect may include:</p>
            <ul className="privacy-list">
              <li>Personal information, such as your name, email address, and phone number</li>
              <li>Payment information, such as your credit or debit card number and billing address</li>
              <li>Device information, such as your IP address, browser type, and device type</li>
              <li>Purchase history, such as the items you have purchased from the Site</li>
            </ul>
          </div>

          {/* How We Use Your Information Section */}
          <div className="privacy-section">
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul className="privacy-list">
              <li>To process and fulfill your orders, including sending you emails to confirm your order and update you on its status</li>
              <li>To communicate with you, such as to send you newsletters or promotional materials</li>
              <li>To personalize your experience on the Site, such as by suggesting products you may be interested in</li>
              <li>To improve the Site and our products and services</li>
              <li>To protect against, identify, and prevent fraud and other illegal activity</li>
            </ul>
          </div>

          {/* Sharing Your Information Section */}
          <div className="privacy-section">
            <h2>Sharing Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul className="privacy-list">
              <li>With third-party service providers who help us provide the Site and our services, such as payment processors and fulfillment centers</li>
              <li>With law enforcement or other government agencies, in response to a legal request or to prevent illegal activity</li>
              <li>In connection with a sale or merger of Denimora or the Site</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
