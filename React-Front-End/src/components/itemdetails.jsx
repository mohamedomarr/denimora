import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useSizeChart } from "../hooks/useSizeChart";
import { useCartMenu } from "../hooks/useCartMenu";
import { useMobileMenu } from "../hooks/useMobileMenu";
import { useCart } from "../contexts/CartContext";
import apiService from "../services/api";
import "../CSS/bootstrap.css";
import "../CSS/Styles.css";

const ItemDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    isSizeChartOpen,
    sizeChartRef,
    sizeChartBtnRef,
    openSizeChart,
    closeSizeChart,
  } = useSizeChart();
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } =
    useCartMenu();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } =
    useMobileMenu();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
  } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [itemData, setItemData] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);

  const productId = searchParams.get("id");
  const productSlug = searchParams.get("slug");
  // Keep these for backward (Fallback) compatibility
  const productName = searchParams.get("name");
  const productPrice = searchParams.get("price");
  const productImage = searchParams.get("image");

  // Handle navigation to sections on home page
  const handleSectionNavigation = (sectionId) => {
    navigate("/", { state: { scrollTo: sectionId } });
    closeMobileMenu(); // Close mobile menu after clicking
  };

  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // If we have id and slug, use the API
        if (productId && productSlug) {
          const response = await apiService.getProductDetail(
            productId,
            productSlug
          );
          if (response.data) {
            const product = response.data;
            setItemData({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price),
              image: product.image_url || product.image,
              description: product.description,
              slug: product.slug,
              available_sizes: product.available_sizes || [],
            });
            setBasePrice(parseFloat(product.price));
            document.title = `DENIMORA - ${product.name}`;

            // Store available sizes
            if (product.available_sizes && product.available_sizes.length > 0) {
              setAvailableSizes(product.available_sizes);
            }
          }
        }
        // Fallback to URL parameters if API fetch not possible
        else if (productName && productPrice && productImage) {
          const data = {
            name: productName,
            price: parseFloat(productPrice),
            image: productImage,
          };
          setItemData(data);
          setBasePrice(data.price);
          document.title = `DENIMORA - ${data.name}`;
        } else {
          // Neither API parameters nor URL parameters available
          navigate("/shop");
          return;
        }
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details. Please try again later.");

        // If API call fails but we have URL parameters, use those as fallback
        if (productName && productPrice && productImage) {
          const data = {
            name: productName,
            price: parseFloat(productPrice),
            image: productImage,
          };
          setItemData(data);
          setBasePrice(data.price);
          document.title = `DENIMORA - ${data.name}`;
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [
    productId,
    productSlug,
    productName,
    productPrice,
    productImage,
    navigate,
  ]);

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleAddToCart = async () => {
    console.log("Add to Cart button clicked");

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    // Find size_id from available sizes if using API
    let sizeId = null;
    if (itemData.id && availableSizes.length > 0) {
      // Try to find the size object
      const sizeObject = availableSizes.find((s) => {
        // Handle different possible structures of size data
        if (s.size && s.size.name === selectedSize) {
          return true;
        } else if (s.name === selectedSize) {
          return true;
        }
        return false;
      });

      if (sizeObject) {
        // Extract the ID based on the structure
        sizeId = sizeObject.size ? sizeObject.size.id : sizeObject.id;
      }
    }

    // Create cart item with appropriate structure
    const item = {
      product_id: itemData.id || null, // API format
      name: itemData.name,
      price: itemData.price,
      image: itemData.image, // Include both image formats for compatibility
      image_url: itemData.image,
      size: selectedSize,
      size_id: sizeId,
      quantity: quantity,
      totalPrice: itemData.price * quantity,
    };

    console.log("Adding item to cart:", item);

    // Use a non-async approach to avoid Promise handling issues
    addToCart(item);
    console.log("Cart updated, opening cart menu");
    openCartMenu();

    // Show visual feedback that item was added
    const addToCartButton = document.querySelector(".add-to-cart button");
    if (addToCartButton) {
      const originalText = addToCartButton.textContent;
      addToCartButton.textContent = "Added!";
      addToCartButton.style.backgroundColor = "#28355B";
      addToCartButton.style.color = "#B59F73";

      setTimeout(() => {
        addToCartButton.textContent = originalText;
        addToCartButton.style.backgroundColor = "";
      }, 2000);
    }
  };

  // Cart Checkout Button
  const handleCheckoutBtn = () => {
    closeCartMenu();
    navigate("/checkout");
  };

  const totalPrice = basePrice * quantity;

  if (isLoading)
    return <div className="loading">Loading product details...</div>;
  if (error && !itemData) return <div className="error">{error}</div>;
  if (!itemData) return null;

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

      {/* Shop Item Section */}
      <section className="shop-item-container">
        <div className="shop-item-img">
          <img
            src={itemData.image}
            alt={itemData.name}
            id="productImage"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/Assets/Shop/placeholder.jpg"; // Fallback image
            }}
          />
        </div>

        <div className="shop-item-content">
          <div className="content-text">
            <h3 id="productName">{itemData.name}</h3>
            <h3>LE {basePrice.toFixed(2)}</h3>
            <p>
              {itemData.description ||
                `Denimora
              100% cotton of softness and does not contain polyester and elastin
              2 High quality due to the methods of fabric and treatment
              3 High density fabric (From 12 To 14) ounces for each one
              Which means a distinctive appearance`}
            </p>

            <div className="size-selection">
              <div className="size-btns">
                {availableSizes.length > 0 ? (
                  // If we have API data with available sizes
                  availableSizes.map((sizeObj) => (
                    <button
                      key={sizeObj.size.id}
                      className={
                        selectedSize === sizeObj.size.name ? "active" : ""
                      }
                      onClick={() => handleSizeSelect(sizeObj.size.name)}
                    >
                      {sizeObj.size.name}
                    </button>
                  ))
                ) : (
                  <div className="no-sizes">Out of Stock</div>
                )}
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
                <button onClick={handleAddToCart}>Add to Cart</button>
              </div>
            </div>

            <div className="size-chart-Lgs">
              <div className="size-chart-container-lgs">
                <div className="size-chart-title-lgs">
                  <h2>Our Size Chart</h2>
                </div>
                <div className="size-chart-img-lgs">
                  <img
                    src="/Assets/SZchrt/Size-Chart-Table.png"
                    alt="Size Chart"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="accordion description-accordion">
          <div className="accordion-item">
            <h2 className="accordion-header" id="headingOne">
              <button
                className={`accordion-button ${
                  isAccordionOpen ? "" : "collapsed"
                }`}
                type="button"
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                aria-expanded={isAccordionOpen}
                aria-controls="collapseOne"
              >
                <i
                  className="fas fa-file-alt"
                  style={{ marginRight: "0.5rem" }}
                ></i>
                Description
              </button>
            </h2>
            <div
              id="collapseOne"
              className={`accordion-collapse collapse ${
                isAccordionOpen ? "show" : ""
              }`}
              aria-labelledby="headingOne"
            >
              <div className="accordion-body">
                <p>
                  {itemData.description ||
                    `Denimora
                  100% cotton of softness and does not contain polyester and elastin
                  High quality due to the methods of fabric and treatment
                  High density fabric (From 12 To 14) ounces for each one
                  Which means a distinctive appearance
                  Average weight
                  Made of Denim Saladge's fabric, which is one of the highest raw materials
                  investment value because it lives for long years
                  The best option for the professionals who appreciate the quality,The bladder, design and luxurious details`}
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
              href="https://www.facebook.com/profile.php?id=61575880045988"
              className="fab fa-facebook-f"
            ></a>
            <a
              href="https://www.instagram.com/denimora25"
              className="fab fa-instagram"
            ></a>
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
      <div
        className={`side-bar-size-chart ${isSizeChartOpen ? "active" : ""}`}
        ref={sizeChartRef}
      >
        <div className="close-size-chart-btn" onClick={closeSizeChart}>
          &times;
        </div>
        <div className="side-bar-size-chart-container">
          <img src="/Assets/SZchrt/Size-Chart-Table.png" alt="Size Chart" />

          <img src="/Assets/SZchrt/jeans.png" alt="Jeans" />
        </div>
      </div>

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
            {!cartItems || cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map((item, index) => {
                console.log("Rendering cart item:", item);
                return (
                  <div key={`cart-item-${index}`} className="cart-item">
                    <div className="cart-item-image">
                      <img
                        src={item.image_url || item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/Assets/Shop/placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h3>{item.name}</h3>
                      {item.size && <p>Size: {item.size}</p>}
                      <p>Price: LE {Number(item.price).toFixed(2)}</p>
                      <p>
                        Total: LE{" "}
                        {Number(
                          item.totalPrice || item.price * item.quantity
                        ).toFixed(2)}
                      </p>
                      <div className="cart-item-quantity">
                        <button
                          onClick={() => {
                            const newQuantity = Math.max(1, item.quantity - 1);
                            updateQuantity(item.name, item.size, newQuantity);
                          }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => {
                            const newQuantity = item.quantity + 1;
                            updateQuantity(item.name, item.size, newQuantity);
                          }}
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
                );
              })
            )}
          </div>
          <div className="cart-total">
            <p>
              Total: <span>LE {getTotalPrice().toFixed(2)}</span>
            </p>
            {cartItems && cartItems.length > 0 && (
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

export default ItemDetails;
