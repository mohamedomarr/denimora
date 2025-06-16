import React from "react";
import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMobileMenu } from "../../contexts/MobileMenuContext";

const MobileMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMenuOpen, menuRef, closeMobileMenu } = useMobileMenu();

  // Determine if we're on the home page
  const isHome = location.pathname === '/';

  // Handle section navigation
  const handleSectionNavigation = (sectionId) => {
    if (isHome) {
      // If we're on home page, scroll to section
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        closeMobileMenu();
      }
    } else {
      // If we're on another page, navigate to home with scroll state
      navigate('/', { state: { scrollTo: sectionId } });
      closeMobileMenu();
    }
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeMobileMenu();
    }
  };

  // Handle clicks outside the mobile menu (backup for edge cases)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        closeMobileMenu();
      } 
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen, menuRef, closeMobileMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  if (!isMenuOpen) return null;

  return (
    <div 
      className="mobile-menu-overlay" 
      onClick={handleOverlayClick}
    >
      <div
        className={`mobile-menu ${isMenuOpen ? "active" : ""}`}
        id="mobileMenu"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="close-menu" onClick={closeMobileMenu}>
          &times;
        </div>
        <nav>
          <Link to="/" onClick={closeMobileMenu}>
            Home
          </Link>
          <Link to="/shop" onClick={closeMobileMenu}>
            Shop
          </Link>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("About-Us");
            }}
          >
            About Us
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("Contact-Us");
            }}
          >
            Contact Us
          </a>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
