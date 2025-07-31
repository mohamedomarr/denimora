import React, { useEffect } from 'react';

const ShippingDelivery = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="shipping-delivery-page">
      <div className="shipping-page-container">
        
        {/* Page Title */}
        <div className="shipping-page-header">
          <h1>Shipping & Delivery</h1>
        </div>

        {/* Main Content */}
        <div className="shipping-page-content">
          
          {/* Order Processing Section */}
          <div className="shipping-section">
            <h2>Order Processing</h2>
            <p>
                Orders are processed within 1–2 business days after confirmation. You will receive a notification 
                with tracking details once your order ships.
            </p>
          </div>

          {/* Delivery Time Section */}
          <div className="shipping-section">
            <h2>Delivery Time</h2>
            <p>
                Estimated delivery is <strong>7 business days</strong>, plus or minus 2 days depending on your location.
            </p>
          </div>

          {/* Shipping Fees Section */}
          <div className="shipping-section">
            <h2>Shipping Fees</h2>
            <p>
                Calculated at checkout based on your address. Any taxes or duties are the customer's responsibility. 
            </p>
          </div>

          {/* Address Accuracy Section */}
          <div className="shipping-section">
            <h2>Address Accuracy</h2>
            <p>
                Please ensure your shipping details are correct to avoid delays or failed delivery.
            </p>
          </div>

          {/* Damaged or Lost Orders Section */}
          <div className="shipping-section">
            <h2>Damaged or Lost Orders</h2>
            <p>
              If your order arrives damaged or is lost, contact us immediately at{' '}
              <a href="mailto:denimora1011@gmail.com" className="shipping-email-link">
                denimora1011@gmail.com
              </a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShippingDelivery;
