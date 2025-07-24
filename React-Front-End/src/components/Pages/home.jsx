import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMobileMenu } from "../../contexts/MobileMenuContext";
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useCart } from "../../contexts/CartContext";
import { useCartPopup } from "../Layout/MainLayout";
import apiService from "../../services/api";
import "../../CSS/bootstrap.css";
import "../../CSS/Styles.css";

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { closeMobileMenu } = useMobileMenu();
  const { handleCartIconClick } = useCartPopup();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
  }= useCart();
  
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
  //our best section
  const [bestProducts, setBestProducts] = useState([]);
  const [isLoadingBest, setIsLoadingBest] = useState(true);
  const [bestError, setBestError] = useState(null);

  // Handle navigation to product details
  const handleProductClick = (product) => {
    navigate(`/shop-item?id=${product.id}&slug=${product.slug}`);
  };

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

  // Fetch best products from API
  useEffect(() => {
  const fetchBestProducts = async () => {
    setIsLoadingBest(true);
    setBestError(null);
    try {
      // Pass query param to get only featured products
      const response = await apiService.getProducts({ is_featured: true });
      if (response.data && Array.isArray(response.data)) {
        setBestProducts(response.data); // Show all featured products
      } else {
        setBestError("Failed to load best products.");
      }
    } catch (err) {
      setBestError("Failed to load best products.");
    } finally {
      setIsLoadingBest(false);
    }
  };
  fetchBestProducts();
  }, []);

  // Fetch cart data
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const cartResponse = await apiService.getCart();
        if (cartResponse.data && cartResponse.data.items) {
          // Update local cart state with server data
          // You'll need to implement this in your CartContext
          // updateCartFromServer(cartResponse.data.items);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };

    fetchCart();
  }, []);

  // Handle smooth scrolling to sections
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      closeMobileMenu(); // Close mobile menu after clicking
    }
  };

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
            <img src="/Assets/Shop/AboutUs-min.jpg" alt="About DENIMORA" />
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
      <section className="shop-section" style={{ display: bestProducts.length === 0 ? "none" : undefined }}>
        <div className="section-title">
          <h2>Best Sellers</h2>
        </div>
        <div className="products-container">
          {isLoadingBest ? (
            <p>Loading...</p>
          ) : bestError ? (
            <p className="error-banner">{bestError}</p>
          ) : bestProducts.length === 0 ? (
            <p className="no-products">No featured products available</p>
          ) : (
            bestProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                data-item={JSON.stringify(product)}
                onClick={(e) => {
                  if (!e.target.closest(".cart-icon")) {
                    window.location.href = `/shop-item?id=${product.id}&slug=${product.slug}`;
                  }
                }}
              >
                <div className="product-img-wrapper">
                  <img src={product.image_url || product.image} alt={product.name} />
                  <a href="#" className="cart-icon" onClick={(e) => handleCartIconClick(e, product)}>
                    <i className="fas fa-bag-shopping"></i>
                  </a>
                </div>
                <div className="cart-text">
                  <h3>{product.name}</h3>
                  <p>LE {Number(product.price).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
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
                {isSubmitting ? "Sending..." : "Send "}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;