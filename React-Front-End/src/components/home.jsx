import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePopup } from '../hooks/usePopup';
import { useMobileMenu } from '../hooks/useMobileMenu';
import { useCartMenu } from '../hooks/useCartMenu';
import { useCart } from '../contexts/CartContext';
import '../CSS/bootstrap.css';
import '../CSS/Styles.css';

const Home = () => {
  const { showPopup, activeTab, closePopup, showTab } = usePopup();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } = useCartMenu();
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  const handleCartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <>
      {/* Header */}
      <header className="home-header">
        <div className="navbar">
          <nav className="nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/shop">Shop</Link>
            <Link className="nav-link" to="#About-Us">About Us</Link>
            <Link className="nav-link" to="#Contact-Us">Contact Us</Link>
          </nav>
        </div>

        <div className="logo">
          <img src="/Assets/Logos&Icons/Footer-Logo.svg" alt="Denimora Logo" />
        </div>

        <div className="icons">
          <div className="fas fa-shopping-bag" id="cart-btn" ref={cartBtnRef} onClick={openCartMenu}></div>
          <div className="fas fa-bars" id="menu-btn" ref={menuBtnRef} onClick={openMobileMenu}></div>
        </div>
      </header>


      {/* Hero Section */}
      <div className="hero-section" id="Home">
        <section className="home" id="home">
          <div className="home-content">
            <div className="home-text">
              <p>Casual & Everyday</p>
              <h1>Timeless Turkish <br /> Denim</h1>
              <p>Effortlessly blend turkish style with our Casual & Everyday collection</p>
            </div>

            <div className="home-btn">
              <button>
                <Link to="/shop">Shop Now</Link>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* About Us Section */}
      <section className="about-us" id="About-Us">
        <div className="about-container">
          <div className="about-image">
            <img src="/Assets/Shop/ConatctBgCover1.jpg" alt="About DENIMORA" />
          </div>

          <div className="about-content">
            <h2>About Us</h2>
            <p>
              At <span>DENIMORA</span>, we believe that denim is more than just fabric — it's a lifestyle.
              Our mission is to craft high-quality, stylish, and timeless pieces that empower individuality and confidence.
              By bringing Turkish quality to our egyption market.
            </p>
            <Link to="/shop" className="btn">Shop Now</Link>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section className="shop-section">
        <div className="section-title">
          <h2>Our Best</h2>
        </div>

        <div className="products-container">
          {[
            { name: "Baggi Fit", price: 350, image: "/Assets/Shop/Shop 1.jpg" },
            { name: "Wide Leg", price: 300, image: "/Assets/Shop/Shop 2.jpg" },
            { name: "Straight Leg", price: 450, image: "/Assets/Shop/Shop 3.jpg" },
            { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 6.jpg" }
          ].map((product, index) => (
            <div 
              key={index} 
              className="product-card" 
              data-item={JSON.stringify(product)}
              onClick={(e) => {
                if (!e.target.closest('.cart-icon')) {
                  window.location.href = `/shop-item?${new URLSearchParams(product).toString()}`;
                }
              }}
            >
              <div className="product-img-wrapper">
                <img src={product.image} alt={product.name} />
                <a href="" className="cart-icon">
                  <i className="fas fa-bag-shopping" onClick={(e) => handleCartClick(e, product)}></i>
                </a>
              </div>
              <div className="cart-text">
                <h3>{product.name}</h3>
                <p>LE {product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="Contact-Us" id="Contact-Us">
        <div className="section-title">
          <h2>Get In Touch</h2>
        </div>

        <div className="Contact-Content">
          <div className="text-bg">
            <div className="Text">
              <p>
                We value the connection with our community
                and are here to assist in any way we can.
                Feel free to reach out through the following channels:
              </p>
            </div>
          </div>

          <div className="contact-form">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="inputbox">
                <span className="fas fa-user"></span>
                <input type="text" placeholder="name" />
              </div>
              <div className="inputbox">
                <span className="fas fa-envelope"></span>
                <input type="email" placeholder="email" />
              </div>
              <div className="inputbox">
                <textarea placeholder="Leave Your Message"></textarea>
              </div>
              <input type="submit" value="Send" className="btn" />
            </form>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/Assets/Logos&Icons/denimora-logo-WhiteBg.svg" alt="Denimora Logo" />
          </div>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/#About-Us">About</Link>
            <Link to="/#Contact-Us">Contact</Link>
          </div>

          <div className="footer-socials">
            <a href="https://www.facebook.com/profile.php?id=61575880045988" className="fab fa-facebook-f"></a>
            <a href="https://www.instagram.com/denimora25" className="fab fa-instagram"></a>
            <a href="#" className="fab fa-tiktok"></a>
          </div>

          <p className="footer-credit">
            © <span>DENIMORA</span>
          </p>
        </div>
      </section>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`} id="mobileMenu" ref={menuRef}>
        <div className="close-menu" onClick={closeMobileMenu}>&times;</div>
        <nav>
          <Link to="/" onClick={closeMobileMenu}>Home</Link>
          <Link to="/shop" onClick={closeMobileMenu}>Shop</Link>
          <Link to="#About-Us" onClick={closeMobileMenu}>About Us</Link>
          <Link to="#Contact-Us" onClick={closeMobileMenu}>Contact Us</Link>
        </nav>
      </div>

      {/* Cart Menu */}
      <div className={`cart-menu ${isCartOpen ? 'active' : ''}`} id="cartMenu" ref={cartRef}>
        <div className="close-cart" onClick={closeCartMenu}>&times;</div>
        <div className="cart-content">
          <h2>Your Cart</h2>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map((item, index) => (
                <div key={`${item.name}-${item.size}-${index}`} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p>Size: {item.size}</p>
                    <p>Price: LE {item.price.toFixed(2)}</p>
                    <p>Total: LE {(item.price * item.quantity).toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button onClick={() => updateQuantity(item.name, item.size, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.name, item.size, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button 
                    className="remove-item" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCart(item.name, item.size);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="cart-total">
            <p>Total: <span>LE {getTotalPrice().toFixed(2)}</span></p>
            {cartItems.length > 0 && (
              <button className="checkout-btn">
                <Link to="/checkout">Checkout</Link>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay" id="popup">
          <div className="popup-content">
            <span className="close-btn" onClick={closePopup}>&times;</span>

            <div className="tab-content" id="subscribe" style={{ display: activeTab === 'signup' ? 'block' : 'none' }}>
              
              <h2>Subscribe Our E-mail Newsletter</h2>
              <p>Get the latest news and updates from Denimora</p>
              
              <form onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Email Adress" required />
                <button type="submit" className="btn">Subscribe</button>
              </form>

            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Home;
