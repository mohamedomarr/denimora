import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSizeChart } from '../hooks/useSizeChart';
import { useCartMenu } from '../hooks/useCartMenu';
import { useMobileMenu } from '../hooks/useMobileMenu';
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

const ItemDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSizeChartOpen, sizeChartRef, sizeChartBtnRef, openSizeChart, closeSizeChart } = useSizeChart();
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } = useCartMenu();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
  
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [itemData, setItemData] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const productName = searchParams.get('name');
  const productPrice = searchParams.get('price');
  const productImage = searchParams.get('image');

  useEffect(() => {
    if (!productName || !productPrice || !productImage) {
      navigate('/shop');
      return;
    }

    const data = {
      name: productName,
      price: parseFloat(productPrice),
      image: productImage
    };
    setItemData(data);
    setBasePrice(data.price);
    document.title = `DENIMORA - ${data.name}`;
  }, [productName, productPrice, productImage, navigate]);

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const addToCart = () => {
    alert(`Added ${quantity} ${productName} to cart!`);
  };

  const totalPrice = basePrice * quantity;

  if (!itemData) return null;

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

      {/* Shop Item Section */}
      <section className="shop-item-container">
        <div className="shop-item-img">
          <img 
            src={productImage} 
            alt={productName} 
            id="productImage"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/Assets/Shop/placeholder.jpg'; // Fallback image
            }}
          />
        </div>

        <div className="shop-item-content">
          <div className="content-text">
            <h3 id="productName">{productName}</h3>
            <h3>LE {basePrice.toFixed(2)}</h3>
            <p>
              Denimora
              100% cotton of softness and does not contain polyester and elastin
              2 High quality due to the methods of fabric and treatment
              3 High density fabric (From 12 To 14) ounces for each one
              Which means a distinctive appearance
            </p>

            <div className="size-selection">
              <div className="size-btns">
                <button className="size-btn-1">34</button>
                <button className="size-btn-2">36</button>
                <button className="size-btn-3">38</button>
                <button className="size-btn-4">40</button>
                <button className="size-btn-5">42</button>
              </div>
            </div>
          </div>

          <div className="bottom-section">

            <div className="actoins">
              <div>
                <h6>Price : </h6>
                <h3>LE {totalPrice.toFixed(2)}</h3>
              </div>

              <div>
              <h6>Quantity : </h6>
              <div className="quantity-selection">
                <button onClick={decreaseQuantity}>-</button>
                <input 
                  type="number" 
                  id="quantity" 
                  value={quantity}
                  onChange={handleQuantityChange}
                  min="1"
                />
                <button onClick={increaseQuantity}>+</button>
              </div>
              </div>

              <div className="add-to-cart">
                <button onClick={addToCart}>Add to Cart</button>
              </div>
            </div>

            <div className="size-chart-Lgs">
              <div className="size-chart-container-lgs">
                <div className="size-chart-title-lgs">
                  <h2>Our Size Chart</h2>
                </div>
                <div className="size-chart-img-lgs">
                  <img src="/Assets/Shop/Navy Size Chart.png" alt="Size Chart" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="accordion description-accordion">
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingOne">
              <button 
                className={`accordion-button ${isAccordionOpen ? '' : 'collapsed'}`}
                type="button" 
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                aria-expanded={isAccordionOpen}
                aria-controls="collapseOne"
              >
                <i className="fas fa-file-alt" style={{ marginRight: '0.5rem' }}></i>
                Description
              </button>
            </h2>
            <div 
              id="collapseOne" 
              className={`accordion-collapse collapse ${isAccordionOpen ? 'show' : ''}`}
              aria-labelledby="headingOne"
            >
              <div className="accordion-body">
                <p>
                  Denimora
                  100% cotton of softness and does not contain polyester and elastin
                  High quality due to the methods of fabric and treatment
                  High density fabric (From 12 To 14) ounces for each one
                  Which means a distinctive appearance
                  Average weight
                  Made of Denim Saladge's fabric, which is one of the highest raw materials
                  investment value because it lives for long years
                  The best option for the professionals who appreciate the quality,The bladder, design and luxurious details
                </p>
              </div>
            </div>
          </div>
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

      {/* Size Chart Button */}
      <button 
        className="side-bar-btn" 
        ref={sizeChartBtnRef}
        onClick={openSizeChart}
      >
        <span className="side-bar-btn-inner">
          Size chart <i className="fas fa-ruler"></i>
        </span>
      </button>

      {/* Size Chart Sidebar */}
      <div className={`side-bar-size-chart ${isSizeChartOpen ? 'active' : ''}`} ref={sizeChartRef}>
        <div className="close-size-chart-btn" onClick={closeSizeChart}>&times;</div>
        <div className="side-bar-size-chart-container">

          <img src="/Assets/Shop/Navy Size Chart(1).png" alt="Size Chart" />
          
          <img src="/Assets/Shop/jeans  .png" alt="Jeans" />

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
    </>
  );
};

export default ItemDetails;
