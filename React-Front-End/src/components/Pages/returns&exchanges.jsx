import React, { useEffect } from 'react';
import ProgressBarManager from '../Shared/ProgressBarManager';

const ReturnsExchanges = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ProgressBarManager autoStartDelay={500}>
      <div className="returns-exchanges-page">
      <div className="returns-page-container">
        
        {/* Page Title */}
        <div className="returns-page-header">
          <h1>Returns & Exchanges</h1>
        </div>

        {/* Main Content */}
        <div className="returns-page-content">
          
          {/* Introduction Section */}
          <div className="returns-section">
            <p>
              We want you to love your purchase, but if you're not completely satisfied, we're here to help.
            </p>
          </div>

          {/* Return Section */}
          <div className="returns-section">
            <h2>Return</h2>
            <p>
              You have <strong>14 days</strong> from the date of delivery to request a return.
            </p>
          </div>

          {/* Conditions for Return Section */}
          <div className="returns-section">
            <h2>Conditions for Return</h2>
            <ul className="returns-list">
              <li>Items must be unused, unwashed, and in original condition</li>
              <li>Must include original packaging and tags attached</li>
              <li>Proof of purchase (receipt or order confirmation) is required</li>
            </ul>
          </div>

          {/* Exchange Section */}
          <div className="returns-section">
            <h2>Exchange</h2>
            <ul className="returns-list">
              <li>Exchanges are <strong>FREE</strong> if the item you want is the same price</li>
              <li>If there is a price difference, you will only pay the difference</li>
              <li>Shipping fees may apply</li>
            </ul>
          </div>

          {/* Non-returnable items Section */}
          <div className="returns-section">
            <h2>Non-returnable items</h2>
            <ul className="returns-list">
              <li>Sale or discounted items</li>
            </ul>
          </div>

          {/* Refunds Section */}
          <div className="returns-section">
            <h2>Refunds</h2>
            <ul className="returns-list">
              <li>
                opening the package upon delivery is not permitted. Unfortunately, this means you won't be able to inspect or separate items upon receipt
              </li>
              <li>Once we receive and inspect your return, we'll notify you.</li>
              <li>Approved returns will be refunded to your original payment method within 7–10 business days.</li>
            </ul>
          </div>

          {/* Return Shipping Section */}
          <div className="returns-section">
            <h2>Return Shipping</h2>
            <ul className="returns-list">
              <li>Return shipping is the responsibility of the customer</li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="returns-section">
            <p>
              To start a return, please contact us at:{' '}
              <a href="mailto:denimora1011@gmail.com" className="returns-email-link">
                denimora1011@gmail.com
              </a>{' '}
              OR{' '}
              <a href="tel:+201099470666" className="returns-phone-link">
                01099470666
              </a>{' '}
              OR DM us on our Instagram page
            </p>
          </div>

        </div>
      </div>
    </div>
    </ProgressBarManager>
  );
};

export default ReturnsExchanges;
