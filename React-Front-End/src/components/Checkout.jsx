import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCartMenu } from '../hooks/useCartMenu';
import { useMobileMenu } from '../hooks/useMobileMenu';


import '../CSS/Styles.css';


const governments = [
    "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum",
    "Gharbiya", "Ismailia", "Menofia", "Minya", "Qaliubiya", "New Valley",
    "Suez", "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharkia",
    "South Sinai", "Kafr Al sheikh", "Matrouh", "Luxor", "Qena", "North Sinai", "Sohag"
];

const SHIPPING_FEE = 100;


const Checkout = () => {
    const { cartItems, getTotalPrice } = useCart();
    const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
    const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } = useCartMenu();
    const { addToCart, removeFromCart, updateQuantity } = useCart();
    const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        government: '',
        postal: '',
        phone: ''
    });

    const subtotal = getTotalPrice();
    const total = subtotal + SHIPPING_FEE;

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDiscountApply = (e) => {
        e.preventDefault();
        // Implement discount logic here
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Implement order submission logic here
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

            {/* checkout container */}
            <div className="checkout-main-wrapper">

                {/* Order Summary Collapsible */}
                <div className="order-summary-collapsible">

                    <button
                        className="order-summary-toggle"
                        onClick={() => setIsOrderSummaryOpen(v => !v)}
                    >
                        Order summary
                        <span>
                            <i className={`fas fa-chevron-${isOrderSummaryOpen ? 'up' : 'down'}`}></i>
                        </span>
                        <span className="order-summary-total">
                            LE  {total.toFixed(2)}
                        </span>
                    </button>

                    {isOrderSummaryOpen && (
                        <div className="order-summary-dropdown">
                            {cartItems.map((item, idx) => (
                                <div key={idx} className="order-summary-item">

                                    <img src={item.image} alt={item.name} className="order-summary-item-image" />
                                    <div className="order-summary-item-details">
                                        <div className="order-summary-item-name">{item.name}</div>
                                        <div className="order-summary-item-size">Size : {item.size}</div>

                                        <div className="order-summary-item-price"> Price : LE {item.price.toFixed(2)}<span> --------- Quantity : X{item.quantity}</span></div>
                                    </div>

                                </div>
                            ))}

                            <div className="totals">
                                <div className="order-summary-totals">
                                    <span>Subtotal</span>
                                    <span>{subtotal.toFixed(2)} LE</span>
                                </div>
                                <div className="order-summary-totals">
                                    <span>Shipping</span>
                                    <span>{SHIPPING_FEE.toFixed(2)} LE</span>
                                </div>
                                <div className="order-summary-totals order-summary-total">
                                    <span>Total</span>
                                    <span>{total.toFixed(2)} LE</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Form */}
                <form className="checkout-form" onSubmit={handleSubmit}>

                    {/* Delivery */}
                    <div className="checkout-delivery-section">
                        <h2>Delivery</h2>
                        <select
                            name="country"
                            value="Egypt"
                            disabled
                        >
                            <option value="Egypt">Egypt</option>
                        </select>
                        <input
                            type="text"
                            name="firstName"
                            placeholder="First name"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="lastName"
                            placeholder="Last name"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="address"
                            placeholder="Address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="apartment"
                            placeholder="Apartment, suite, etc. (optional)"
                            value={formData.apartment}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                        />
                        <select
                            name="government"
                            value={formData.government}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="">Governorate</option>
                            {governments.map(gov => (
                                <option key={gov} value={gov}>{gov}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            name="postal"
                            placeholder="Postal code (optional)"
                            value={formData.postal}
                            onChange={handleInputChange}
                        />
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <button type="submit" className="checkout-pay-btn">Place Order</button>
                </form>

            </div>

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
                            <button className="checkout-btn" >
                                <Link to="/checkout">Checkout</Link>
                            </button>
                        )}
                    </div>
                </div>
            </div>



        </>
    );
};

export default Checkout;
