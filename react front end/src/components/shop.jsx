import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCartMenu } from '../contexts/CartMenuContext';
import { useMobileMenu } from '../contexts/MobileMenuContext';
import '../CSS/bootstrap.css';
import '../CSS/Styles.css';

const governments = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum", "Gharbiya", "Ismailia", "Menofia", "Minya", "Qaliubiya", "New Valley", "Suez", "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharkia", "South Sinai", "Kafr Al sheikh", "Matrouh", "Luxor", "Qena", "North Sinai", "Sohag"
];

function CheckoutPopup({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    government: '',
    address: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.government || !form.address || !form.email) {
      setError('All fields are required.');
      return;
    }
    setError('');
    alert('Order submitted!');
    onClose();
  };

  return (
    <div className="checkout-popup-overlay">
      <div className="checkout-popup-content">
        <button className="checkout-close-btn" onClick={onClose}>&times;</button>
        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Checkout</h2>
          {error && <div className="checkout-form-error">{error}</div>}
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} required />
          <select name="government" value={form.government} onChange={handleChange} required>
            <option value="">Select Government</option>
            {governments.map(gov => <option key={gov} value={gov}>{gov}</option>)}
          </select>
          <input name="address" placeholder="Address" value={form.address} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <button type="submit">Submit Order</button>
        </form>
      </div>
    </div>
  );
}

const Shop = () => {
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } = useCartMenu();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
  const [showCheckout, setShowCheckout] = useState(false);

  const products = [
    { name: "Baggi Fit", price: 350, image: "/Assets/Shop/Shop 1.jpg" },
    { name: "Wide Leg", price: 300, image: "/Assets/Shop/Shop 2.jpg" },
    { name: "Straight Leg", price: 450, image: "/Assets/Shop/Shop 3.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 6.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 4.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 5.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 7.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 8.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 9.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 10.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 11.jpg" },
    { name: "Baggi Fit Light", price: 250, image: "/Assets/Shop/Shop 12.jpg" }
  ];

  const handleProductClick = (product) => {
    const params = new URLSearchParams({
      name: product.name,
      price: product.price,
      image: product.image
    });
    window.location.href = `/shop-item?${params.toString()}`;
  };

  return (
    <>
      {/* Header */}
      <header className="header" id="Shop-Header">
        <div className="shop-page-navbar">
          <nav className="nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/shop">Shop</Link>
            <Link className="nav-link" to="/#About-Us">About Us</Link>
            <Link className="nav-link" to="/#Contact-Us">Contact Us</Link>
          </nav>
        </div>

        <div className="logo">
          <img src="/Assets/Logos&Icons/DenimaraLogoNavyNg.svg" alt="Denimora Logo" />
        </div>

        <div className="shop-page-icons">
          <div className="fas fa-shopping-bag" id="cart-btn" ref={cartBtnRef} onClick={openCartMenu}></div>
          <div className="fas fa-bars" id="menu-btn" ref={menuBtnRef} onClick={openMobileMenu}></div>
        </div>
      </header>

      {/* Checkout Popup */}
      {showCheckout && <CheckoutPopup onClose={() => setShowCheckout(false)} />}

      {/* Shop Section */}
      <section className="shop-section">
        <div className="Shop-section-title">
          <h2>Our Collection</h2>
        </div>

        <div className="products-container">
          {products.map((product, index) => (
            <div 
              key={index} 
              className="product-card" 
              onClick={() => handleProductClick(product)}
            >
              <div className="product-img-wrapper">
                <img 
                  src={product.image} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/Assets/Shop/placeholder.jpg';
                  }}
                />
                <a href="" className="cart-icon">
                  <i className="fas fa-bag-shopping"></i>
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

      {/* Footer Section */}
      <section className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/Assets/Logos&Icons/denimora logo  WhiteBg.svg" alt="Denimora Logo" />
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

      {/* Cart Menu */}
      <div className={`cart-menu ${isCartOpen ? 'active' : ''}`} id="cartMenu" ref={cartRef}>
        <div className="close-cart" onClick={closeCartMenu}>&times;</div>
        <div className="cart-content">
          <h2>Your Cart</h2>
          <div className="cart-items">
            <p className="empty-cart">Your cart is empty</p>
          </div>
          <div className="cart-total">
            <p>Total: <span>LE 0.00</span></p>
            <button className="checkout-btn" onClick={() => setShowCheckout(true)}>Checkout</button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`} id="mobileMenu" ref={menuRef}>
        <div className="close-menu" onClick={closeMobileMenu}>&times;</div>
        <nav>
          <Link to="/" onClick={closeMobileMenu}>Home</Link>
          <Link to="/shop" onClick={closeMobileMenu}>Shop</Link>
          <Link to="/#About-Us" onClick={closeMobileMenu}>About Us</Link>
          <Link to="/#Contact-Us" onClick={closeMobileMenu}>Contact Us</Link>
        </nav>
      </div>
    </>
  );
};

export default Shop;
