import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMobileMenu } from "../../contexts/MobileMenuContext";
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useCart } from "../../contexts/CartContext";
import "../../CSS/bootstrap.css";
import "../../CSS/Styles.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();
  const { cartBtnRef, openCartMenu } = useCartMenu();
  const { menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();

  // Determine if we're on the home page
  const isHome = location.pathname === '/';
  
  // Set classes and assets based on current route
  const headerClass = isHome ? 'home-header' : 'header';
  const navbarClass = isHome ? 'navbar' : 'shop-page-navbar';
  const iconsClass = isHome ? 'icons' : 'shop-page-icons';
  const logoSrc = isHome 
    ? '/Assets/Logos&Icons/Footer-Logo.svg' 
    : '/Assets/Logos&Icons/DenimaraLogoNavyNg.svg';

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

  return (
    <header className={headerClass} id={!isHome ? 'Shop-Header' : undefined}>
      <div className={navbarClass}>
        <nav className="nav">
          <Link className="nav-link" to="/">
            Home
          </Link>
          <Link className="nav-link" to="/shop">
            Shop
          </Link>
          <a
            className="nav-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('About-Us');
            }}
          >
            About Us
          </a>
          <a
            className="nav-link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('Contact-Us');
            }}
          >
            Contact Us
          </a>
        </nav>
      </div>

      <div className="logo">
        <img src={logoSrc} alt="Denimora Logo" />
      </div>

      <div className={iconsClass}>
        <div
          className="fas fa-shopping-bag cart-icon-with-number"
          id="cart-btn"
          ref={cartBtnRef}
          onClick={openCartMenu}
        >
          {cartItems.length > 0 && (
            <span className="cart-number">{cartItems.length}</span>
          )}
        </div>
        <div
          className="fas fa-bars"
          id="menu-btn"
          ref={menuBtnRef}
          onClick={openMobileMenu}
        ></div>
      </div>
    </header>
  );
};

export default Header;

