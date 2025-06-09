import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useCartMenu } from "../hooks/useCartMenu";
import { useMobileMenu } from "../hooks/useMobileMenu";
import apiService from "../services/api";
import "../CSS/Styles.css";

const governments = [
  "Cairo",
  "Giza",
  "Alexandria",
  "Dakahlia",
  "Red Sea",
  "Beheira",
  "Fayoum",
  "Gharbiya",
  "Ismailia",
  "Menofia",
  "Minya",
  "Qaliubiya",
  "New Valley",
  "Suez",
  "Aswan",
  "Assiut",
  "Beni Suef",
  "Port Said",
  "Damietta",
  "Sharkia",
  "South Sinai",
  "Kafr Al sheikh",
  "Matrouh",
  "Luxor",
  "Qena",
  "North Sinai",
  "Sohag",
];

const DEFAULT_SHIPPING_FEE = 100; // Fallback if API fails

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(false);
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } =
    useCartMenu();
  // We use these functions in the cart display
  const { removeFromCart, updateQuantity } = useCart();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    apartment: "",
    city: "",
    government: "",
    postal: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [errors, setErrors] = useState({
    email: "",
    phone: "",
  });
  // NEW: Dynamic shipping state
  const [shippingFee, setShippingFee] = useState(DEFAULT_SHIPPING_FEE);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  const subtotal = getTotalPrice();
  const total = subtotal + shippingFee; // Use dynamic shipping fee

  // NEW: Function to fetch shipping cost
  const fetchShippingCost = async (governorate) => {
    if (!governorate) {
      setShippingFee(DEFAULT_SHIPPING_FEE);
      setShippingError(null);
      return;
    }

    setIsLoadingShipping(true);
    setShippingError(null);

    try {
      const response = await apiService.getShippingCost(governorate);
      if (response.data && response.data.shipping_cost !== undefined) {
        setShippingFee(response.data.shipping_cost);
        console.log(`Shipping cost for ${governorate}: ${response.data.shipping_cost} LE`);
        
        // Check if governorate is not found or inactive
        if (!response.data.governorate_found) {
          setShippingError(`Shipping is currently not defined for ${governorate}`);
        }
      } else {
        setShippingFee(DEFAULT_SHIPPING_FEE);
        setShippingError('Failed to get shipping cost');
      }
    } catch (error) {
      console.error('Error fetching shipping cost:', error);
      setShippingError('Failed to get shipping cost');
      setShippingFee(DEFAULT_SHIPPING_FEE); // Fallback to default
    } finally {
      setIsLoadingShipping(false);
    }
  };

  // Handle navigation to sections on home page
  const handleSectionNavigation = (sectionId) => {
    navigate("/", { state: { scrollTo: sectionId } });
    closeMobileMenu(); // Close mobile menu after clicking
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^(011|012|010|015)\d{8}$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // NEW: Fetch shipping cost when government changes
    if (name === "government" && value) {
      fetchShippingCost(value);
    }

    // Clear error when user starts typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    // Validate email
    if (name === "email" && value) {
      if (!validateEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address",
        }));
      }
    }

    // Validate phone
    if (name === "phone" && value) {
      if (!validatePhone(value)) {
        setErrors((prev) => ({
          ...prev,
          phone: "Enter a valid Egyptian phone number !",
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");

    // Validate form
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.address ||
      !formData.city ||
      !formData.government ||
      !formData.phone
    ) {
      setOrderError("Please fill in all required fields");
      console.log("Form validation failed");
      return;
    }

    if (errors.email || errors.phone) {
      setOrderError("Please fix the errors in the form before submitting.");
      console.log("Form validation failed");
      return;
    }

    if (cartItems.length === 0) {
      setOrderError(
        "Your cart is empty. Please add items to your cart before placing an order."
      );
      console.log("Cart is empty");
      return;
    }

    console.log("Form validation passed, proceeding with order");
    setIsSubmitting(true);
    setOrderError(null);

    try {
      console.log("Preparing order data...");

      // Format the order data to match Django backend expectations
      const orderData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        address:
          formData.address +
          (formData.apartment ? ", " + formData.apartment : ""),
        city: formData.city,
        postal_code: formData.postal || "00000", // Provide default if empty
        phone: formData.phone,
        // Include cart items directly in the request with explicit size information
        items: cartItems.map((item) => {
          console.log("Processing cart item for order:", item);
          return {
            product_id: item.product_id ? parseInt(item.product_id) : null,
            name: item.name,
            price: parseFloat(item.price),
            quantity: parseInt(item.quantity),
            // Ensure size information is included
            size: item.size || (item.size_name ? item.size_name : null),
            size_id: item.size_id ? parseInt(item.size_id) : null,
          };
        }),
        // Additional fields for tracking (not used by Django backend)
        shipping_fee: shippingFee,
        total_amount: total,
        state: formData.government,
        apartment: formData.apartment,
      };

      console.log("Submitting order:", orderData);

      try {
        // Always use API mode
        console.log("Sending order to API...");
        console.log("API URL:", `${apiService.getBaseUrl()}/orders/create/`);
        console.log(
          "Order data being sent:",
          JSON.stringify(orderData, null, 2)
        );

        const response = await apiService.createOrder(orderData);
        console.log("Order created successfully:", response.data);

        // Store the order in localStorage as a backup
        const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        const newOrder = {
          id: response.data.id || Date.now(),
          ...orderData,
          created_at: response.data.created || new Date().toISOString(),
          api_success: true,
        };
        savedOrders.push(newOrder);
        localStorage.setItem("orders", JSON.stringify(savedOrders));

        // Clear the cart
        clearCart();

        // Show success message
        setOrderSuccess(true);

        // Redirect to home page after a delay
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } catch (apiError) {
        console.error("API error when creating order:", apiError);

        // Log detailed error information
        if (apiError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Error response data:", apiError.response.data);
          console.error("Error response status:", apiError.response.status);
          console.error("Error response headers:", apiError.response.headers);

          // Check for insufficient stock error
          if (
            apiError.response.data &&
            apiError.response.data.error === "Insufficient stock"
          ) {
            // Display the user-friendly message from the API
            setOrderError(
              apiError.response.data.message ||
                "There is not enough stock available for one or more items in your cart."
            );
            setIsSubmitting(false);
            return; // Don't proceed with order creation
          }
        } else if (apiError.request) {
          // The request was made but no response was received
          console.error("Error request:", apiError.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error message:", apiError.message);
        }
        console.error("Error config:", apiError.config);

        // For other errors, store in localStorage as fallback
        console.log("API failed, storing order in localStorage as fallback");

        const savedOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        const newOrder = {
          id: Date.now(),
          ...orderData,
          created_at: new Date().toISOString(),
          api_success: false,
          error: apiError.message,
        };
        savedOrders.push(newOrder);
        localStorage.setItem("orders", JSON.stringify(savedOrders));

        // Clear the cart
        clearCart();

        // Show success message (we still want to show success to the user for non-stock related errors)
        setOrderSuccess(true);

        // Redirect to home page after a delay
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating order:", error);
      setOrderError("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }


  };

  //Cart Checkout Button
  const handleCheckoutBtn = () => {
    closeCartMenu();
    navigate("/checkout");
  };

  return (
    <>
      {/* Header */}
      <header className="header" id="Shop-Header">
        <div className="shop-page-navbar">
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
                handleSectionNavigation("About-Us");
              }}
            >
              About Us
            </a>
            <a
              className="nav-link"
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

        <div className="logo">
          <img
            src="/Assets/Logos&Icons/DenimaraLogoNavyNg.svg"
            alt="Denimora Logo"
          />
        </div>

        <div className="shop-page-icons">
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

      {/* checkout container */}
      <div className="checkout-main-wrapper">

        {/* Order Summary Collapsible */}
        <div className="order-summary-collapsible">
          <button
            className="order-summary-toggle"
            onClick={() => setIsOrderSummaryOpen((v) => !v)}
          >
            Order summary
            <span>
              <i
                className={`fas fa-chevron-${
                  isOrderSummaryOpen ? "up" : "down"
                }`}
              ></i>
            </span>
            <span className="order-summary-total">LE {total.toFixed(2)}</span>
          </button>

          {isOrderSummaryOpen && (
            <div className="order-summary-dropdown">
              {cartItems.map((item, idx) => (
                <div key={idx} className="order-summary-item">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="order-summary-item-image"
                  />
                  <div className="order-summary-item-details">
                    <div className="order-summary-item-name">{item.name}</div>
                    <div className="order-summary-item-size">
                      Size : {item.size}
                    </div>

                    <div className="order-summary-item-price">
                      {" "}
                      Price : LE {Number(item.price).toFixed(2)}
                      <span> --------- Quantity : X{item.quantity}</span>
                    </div>
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
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isLoadingShipping ? (
                      <>
                        <span style={{ fontSize: '12px', color: '#666' }}>Calculating...</span>
                        <span style={{ fontSize: '10px' }}>⏳</span>
                      </>
                    ) : (
                      <>
                        {shippingFee.toFixed(2)} LE
                        {formData.government && (
                          <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                            ({formData.government})
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
                {shippingError && (
                  <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '5px' }}>
                    {shippingError} - Using default rate
                  </div>
                )}
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
            <select name="country" value="Egypt" disabled>
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
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
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
              {governments.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
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
            {errors.phone && (
              <div className="error-message">{errors.phone}</div>
            )}
          </div>

          {/* Payment */}
          <div className="checkout-payment-section">
            <h2>Payment</h2>
            <div className="checkout-payment-methods">
              <select
                name="payment"
                id="payment"
                placeholder="Select Payment Method"
              >
                <option value="cash">Cash On Delivery</option>
                <option value="card" disabled>
                  Visa/Mastercard
                </option>
                <option value="bank" disabled>
                  Bank Transfer
                </option>
              </select>
            </div>
          </div>

          {/* Final Total */}
          <div className="checkout-final-total">
            <div className="totals">
              <div className="order-summary-totals">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} LE</span>
              </div>
              <div className="order-summary-totals">
                <span>Shipping</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {isLoadingShipping ? (
                    <>
                      <span style={{ fontSize: '12px', color: '#666' }}>Calculating...</span>
                      <span style={{ fontSize: '10px' }}>⏳</span>
                    </>
                  ) : (
                    <>
                      {shippingFee.toFixed(2)} LE
                      {formData.government && (
                        <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>
                          ({formData.government})
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
              {shippingError && (
                <div style={{ fontSize: '12px', color: '#ff6b6b', marginTop: '5px' }}>
                  {shippingError} - Using (100 LE) as a default Shipping Cost
                </div>
              )}
              <div className="order-summary-totals order-summary-total">
                <span>Total</span>
                <span>{total.toFixed(2)} LE</span>
              </div>
            </div>
          </div>

          {orderError && (
            <div
              className="order-error"
              style={{ color: "red", marginBottom: "15px" }}
            >
              {orderError}
            </div>
          )}

          {orderSuccess ? (
            <div
              className="order-success"
              style={{
                color: "#B59F73",
                padding: "20px",
                textAlign: "center",
                border: "1px solid #B59F73",
                borderRadius: "5px",
                marginBottom: "15px",
              }}
            >
              <h3>Order Placed Successfully!</h3>
              <p>
                Thank you for your order. You will be redirected to the home
                page shortly.
              </p>
            </div>
          ) : (
            <button
              type="submit"
              className="checkout-pay-btn"
              disabled={isSubmitting}
              style={{
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </button>
          )}
        </form>
      </div>

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
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("About-Us");
              closeMobileMenu();
            }}
          >
            About Us
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation("Contact-Us");
              closeMobileMenu();
            }}
          >
            Contact Us
          </a>
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
                    <p>Price: LE {Number(item.price).toFixed(2)}</p>
                    <p>
                      Total: LE{" "}
                      {(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
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

    </>
  );
};

export default Checkout;
