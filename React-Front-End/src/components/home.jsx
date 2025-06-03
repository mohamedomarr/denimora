import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePopup } from "../hooks/usePopup";
import { useMobileMenu } from "../hooks/useMobileMenu";
import { useCartMenu } from "../hooks/useCartMenu";
import { useCart } from "../contexts/CartContext";
import apiService from "../services/api";

import "../CSS/bootstrap.css";
import "../CSS/Styles.css";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showPopup, activeTab, closePopup, showTab } = usePopup();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } =
    useMobileMenu();
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } =
    useCartMenu();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
  } = useCart();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactErrors, setContactErrors] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    email: "",
  });
  const [subscriptionErrors, setSubscriptionErrors] = useState({
    email: "",
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Handle scrolling when navigating from other pages
  useEffect(() => {
    if (location.state?.scrollTo) {
      // Add a delay to ensure the page is fully loaded
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [location]);

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu(); // Close mobile menu after clicking
    }
  };

  // Cart Checkout Button
  const handleCheckoutBtn = () => {
    closeCartMenu();
    navigate("/checkout");
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle subscription form input changes
  const handleSubscriptionInputChange = (e) => {
    const { value } = e.target;
    setSubscriptionForm({ email: value });
    // Clear error when user starts typing
    setSubscriptionErrors({ email: "" });
  };

  // Handle subscription form submission
  const handleSubscription = async (e) => {
    e.preventDefault();

    // Validate email
    if (!subscriptionForm.email.trim()) {
      setSubscriptionErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(subscriptionForm.email)) {
      setSubscriptionErrors({ email: "Please enter a valid email address" });
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await apiService.subscribeEmail(subscriptionForm.email, 'popup');
      
      if (response.data.success) {
        setSubscriptionSuccess(true);
        setSubscriptionForm({ email: "" });

        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubscriptionSuccess(false);
          closePopup();
        }, 5000);
      } else {
        setSubscriptionErrors({
          email: response.data.error || "Failed to subscribe. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      let errorMessage = "Failed to subscribe. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setSubscriptionErrors({
        email: errorMessage,
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  // Contact form validation
  const validateContactForm = () => {
    let isValid = true;
    const newErrors = {
      name: "",
      email: "",
      message: "",
    };

    // Name validation
    if (!contactForm.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (contactForm.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
      isValid = false;
    }

    // Email validation
    if (!contactForm.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(contactForm.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Message validation
    if (!contactForm.message.trim()) {
      newErrors.message = "Message is required";
      isValid = false;
    } else if (contactForm.message.trim().length > 500) {
      newErrors.message = "Message should not exceed 500 characters";
      isValid = false;
    }

    setContactErrors(newErrors);
    return isValid;
  };

  // Handle contact form input changes
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    setContactErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!validateContactForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.submitContactMessage(
        contactForm.name,
        contactForm.email,
        contactForm.message
      );
      
      if (response.data.success) {
        setSubmitSuccess(true);
        setContactForm({
          name: "",
          email: "",
          message: "",
        });

        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        // Handle validation errors from the API
        if (response.data.errors) {
          setContactErrors((prev) => ({
            ...prev,
            ...response.data.errors,
          }));
        } else {
          setContactErrors((prev) => ({
            ...prev,
            submit: response.data.error || "Failed to send message. Please try again.",
          }));
        }
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      let errorMessage = "Failed to send message. Please try again.";
      
      if (error.response?.data?.errors) {
        // Handle field-specific errors
        setContactErrors((prev) => ({
          ...prev,
          ...error.response.data.errors,
        }));
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        setContactErrors((prev) => ({
          ...prev,
          submit: errorMessage,
        }));
      } else {
        setContactErrors((prev) => ({
          ...prev,
          submit: errorMessage,
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="home-header">
        <div className="navbar">
          <nav className="nav">
            <Link className="nav-link" to="/">
              Home
            </Link>
            <Link className="nav-link" to="/shop">
              Shop
            </Link>
            <Link
              className="nav-link"
              onClick={() => scrollToSection("About-Us")}
            >
              About Us
            </Link>
            <Link
              className="nav-link"
              onClick={() => scrollToSection("Contact-Us")}
            >
              Contact Us
            </Link>
          </nav>
        </div>

        <div className="logo">
          <img src="/Assets/Logos&Icons/Footer-Logo.svg" alt="Denimora Logo" />
        </div>

        <div className="icons">
          <div
            className="fas fa-shopping-bag"
            id="cart-btn"
            ref={cartBtnRef}
            onClick={openCartMenu}
          ></div>
          <div
            className="fas fa-bars"
            id="menu-btn"
            ref={menuBtnRef}
            onClick={openMobileMenu}
          ></div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="hero-section" id="Home">
        <section className="home" id="home">
          <div className="home-content">
            <div className="home-text">
              <p>Casual & Everyday</p>
              <h1>
                Timeless Turkish <br /> Denim
              </h1>
              <p>
                Effortlessly blend turkish style with our Casual & Everyday
                collection
              </p>
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
              At <span>DENIMORA</span>, we believe that denim is more than just
              fabric — it's a lifestyle. Our mission is to craft high-quality,
              stylish, and timeless pieces that empower individuality and
              confidence. By bringing Turkish quality to our egyption market.
            </p>
            <Link to="/shop" className="btn">
              Shop Now
            </Link>
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
            { name: "Baggi Fit", price: 350, image: "/Assets/Shop/Shop1.jpg" },
            { name: "Wide Leg", price: 300, image: "/Assets/Shop/Shop2.jpg" },
            {
              name: "Straight Leg",
              price: 450,
              image: "/Assets/Shop/Shop3.jpg",
            },
            {
              name: "Baggi Fit Light",
              price: 250,
              image: "/Assets/Shop/Shop6.jpg",
            },
          ].map((product, index) => (
            <div
              key={index}
              className="product-card"
              data-item={JSON.stringify(product)}
              onClick={(e) => {
                if (!e.target.closest(".cart-icon")) {
                  window.location.href = `/shop-item?${new URLSearchParams(
                    product
                  ).toString()}`;
                }
              }}
            >
              <div className="product-img-wrapper">
                <img src={product.image} alt={product.name} />
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

      {/* Contact Us Section */}
      <section className="Contact-Us" id="Contact-Us">
        <div className="section-title">
          <h2>Get In Touch</h2>
        </div>

        <div className="Contact-Content">
          <div className="text-bg">
            <div className="Text">
              <p>
                We value the connection with our community and are here to
                assist in any way we can. Feel free to reach out through the
                following channels:
              </p>
            </div>
          </div>

          <div className="contact-form">
            <form onSubmit={handleContactSubmit}>
              <div className="inputbox">
                <span className="fas fa-user"></span>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={contactForm.name}
                  onChange={handleContactInputChange}
                  className={contactErrors.name ? "error" : ""}
                />
                {contactErrors.name && (
                  <div className="error-message">{contactErrors.name}</div>
                )}
              </div>

              <div className="inputbox">
                <span className="fas fa-envelope"></span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={handleContactInputChange}
                  className={contactErrors.email ? "error" : ""}
                />
                {contactErrors.email && (
                  <div className="error-message">{contactErrors.email}</div>
                )}
              </div>

              <div className="inputbox">
                <textarea
                  name="message"
                  placeholder="Leave Your Message"
                  value={contactForm.message}
                  onChange={handleContactInputChange}
                  className={contactErrors.message ? "error" : ""}
                ></textarea>
                {contactErrors.message && (
                  <div className="error-message">{contactErrors.message}</div>
                )}
              </div>

              {contactErrors.submit && (
                <div className="error-message submit-error">
                  {contactErrors.submit}
                </div>
              )}

              {submitSuccess && (
                <div className="success-message">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}

              <button type="submit" className="btn" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer Section */}
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
            <Link onClick={() => scrollToSection("About-Us")}>About</Link>
            <Link onClick={() => scrollToSection("Contact-Us")}>Contact</Link>
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
            <a href="https://www.tiktok.com/@denimora25?_t=ZS-8wqteSQA6lz&_r=1" className="fab fa-tiktok"></a>
          </div>

          <p className="footer-credit">
            © <span>DENIMORA</span>
          </p>
        </div>
      </section>

      {/* Mobile Menu */}
      <div
        className={`mobile-menu ${isMenuOpen ? "active" : ""}`}
        id="mobileMenu"
        ref={menuRef}
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
          <Link onClick={() => scrollToSection("About-Us")}>About Us</Link>
          <Link onClick={() => scrollToSection("Contact-Us")}>Contact Us</Link>
        </nav>
      </div>

      {/* Cart Menu */}
      <div
        className={`cart-menu ${isCartOpen ? "active" : ""}`}
        id="cartMenu"
        ref={cartRef}
      >
        <div className="close-cart" onClick={closeCartMenu}>
          &times;
        </div>
        <div className="cart-content">
          <h2>Your Cart</h2>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map((item, index) => (
                <div
                  key={`${item.name}-${item.size}-${index}`}
                  className="cart-item"
                >
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p>Size: {item.size}</p>
                    <p>Price: LE {item.price.toFixed(2)}</p>
                    <p>Total: LE {(item.price * item.quantity).toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.name,
                            item.size,
                            item.quantity - 1
                          )
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.name,
                            item.size,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
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
            <p>
              Total: <span>LE {getTotalPrice().toFixed(2)}</span>
            </p>
            {cartItems.length > 0 && (
              <button className="checkout-btn" onClick={handleCheckoutBtn}>
                Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay" id="popup">
          <div className="popup-content">
            <span className="close-btn" onClick={closePopup}>
              &times;
            </span>

            <div
              className={`tab-content ${
                activeTab === "signup" ? "active" : ""
              }`}
              id="subscribe"
            >
              <h2>Subscribe Our E-mail Newsletter</h2>
              <p>Get the latest news and updates from Denimora</p>

              <form onSubmit={handleSubscription}>
                <input
                  type="email"
                  placeholder="Email Address"
                  name="email"
                  value={subscriptionForm.email}
                  onChange={handleSubscriptionInputChange}
                  className={subscriptionErrors.email ? "error" : ""}
                />
                {subscriptionErrors.email && (
                  <div className="error-message">
                    {subscriptionErrors.email}
                  </div>
                )}

                {subscriptionSuccess && (
                  <div className="success-message">
                    Thank you for subscribing to our newsletter!
                  </div>
                )}

                <button type="submit" className="btn" disabled={isSubscribing}>
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
