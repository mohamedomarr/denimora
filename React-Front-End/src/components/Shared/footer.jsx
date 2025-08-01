import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logoSrc = '/Assets/Logos&Icons/Footer-Logo.svg' ;
  
  // State for collapsible Customer Service section on mobile
  const [isCustomerServiceOpen, setIsCustomerServiceOpen] = useState(false);

  // Determine if we're on the home page
  const isHome = location.pathname === '/';

  // Toggle Customer Service section on mobile
  const toggleCustomerService = () => {
    setIsCustomerServiceOpen(!isCustomerServiceOpen);
  };

  // Handle section navigation
  const handleSectionNavigation = (sectionId) => {
    if (isHome) {
      // If we're on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      // If we're on another page, navigate to home with scroll state
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <section className="footer">
      <div className="footer-container">
        
        {/* Main Footer Content */}
        <div className="footer-main">
          
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img
                src={logoSrc}
                alt="Denimora Logo"
              />
            </div>
            
            <p className="footer-description">
              Denimora is a premium denim brand dedicated to creating elegant, comfortable and versatile jeans for people with refined taste. 
            </p>
            
            <div className="footer-socials">
              <a
                href="https://www.facebook.com/share/1P42RQpVK6/?mibextid=wwXIfr"
                className="fab fa-facebook-f"
                target="_blank"
                rel="noopener noreferrer"
              ></a>
              <a
                href="https://www.instagram.com/denimoraa.co"
                className="fab fa-instagram"
                target="_blank"
                rel="noopener noreferrer"
              ></a>
              <a 
                href="https://www.tiktok.com/@denimora25?_t=ZS-8wqteSQA6lz&_r=1" 
                className="fab fa-tiktok"
                target="_blank"
                rel="noopener noreferrer"
              ></a>
            </div>
          </div>

          {/* Customer Service Section - Collapsible on Mobile */}
          <div className="footer-customer-service">
            <h3 
              className="customer-service-header"
              onClick={toggleCustomerService}
            >
              Customer Service
              <i className={`fas fa-chevron-down customer-service-arrow ${isCustomerServiceOpen ? 'open' : ''}`}></i>
            </h3>
            <div className={`customer-service-links ${isCustomerServiceOpen ? 'open' : ''}`}>
              <Link to="/aboutus">About us</Link>
              <Link to="/contact">Contact us</Link>
              <Link to="/shipping-delivery">Shipping & Delivery</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/returns-exchanges">Returns & Exchanges</Link>
              <Link to="/terms-conditions">Terms of Service</Link>
            </div>
          </div>

        </div>

        {/* Footer Credit */}
        <div className="footer-bottom">
          <p className="footer-credit">
            © <span>DENIMORA</span>
          </p>
        </div>

      </div>
    </section>
  );
};

export default Footer;
