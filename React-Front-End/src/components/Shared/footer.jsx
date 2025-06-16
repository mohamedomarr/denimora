import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine if we're on the home page
  const isHome = location.pathname === '/';

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
        <div className="footer-logo">
          <img
            src="/Assets/Logos&Icons/denimora-logo-WhiteBg.svg"
            alt="Denimora Logo"
          />
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("About-Us");
            }}
          >
            About
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("Contact-Us");
            }}
          >
            Contact
          </a>
        </div>

        <div className="footer-socials">
          <a
            href="https://www.facebook.com/share/1P42RQpVK6/?mibextid=wwXIfr"
            className="fab fa-facebook-f"
          ></a>
          <a
            href="https://www.instagram.com/denimora25"
            className="fab fa-instagram"
          ></a>
          <a 
            href="https://www.tiktok.com/@denimora25?_t=ZS-8wqteSQA6lz&_r=1" 
            className="fab fa-tiktok"
          ></a>
        </div>

        <p className="footer-credit">
          © <span>DENIMORA</span>
        </p>
      </div>
    </section>
  );
};

export default Footer;
