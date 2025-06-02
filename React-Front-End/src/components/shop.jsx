import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartMenu } from '../contexts/CartMenuContext';
import { useMobileMenu } from '../contexts/MobileMenuContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import '../CSS/bootstrap.css';
import '../CSS/Styles.css';

// Fallback product data in case API fails
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Classic Blue Jeans",
    slug: "classic-blue-jeans",
    price: 350,
    image_url: "/Assets/Shop/Shop 1.jpg",
    category: { id: 1, name: "Jeans", slug: "jeans" }
  },
  {
    id: 2,
    name: "Baggi Fit",
    slug: "baggi-fit",
    price: 300,
    image_url: "/Assets/Shop/Shop 2.jpg",
    category: { id: 1, name: "Jeans", slug: "jeans" }
  },
  {
    id: 3,
    name: "Wide Leg",
    slug: "wide-leg",
    price: 450,
    image_url: "/Assets/Shop/Shop 3.jpg",
    category: { id: 1, name: "Jeans", slug: "jeans" }
  },
  {
    id: 4,
    name: "Straight Leg",
    slug: "straight-leg",
    price: 250,
    image_url: "/Assets/Shop/Shop 6.jpg",
    category: { id: 2, name: "Pants", slug: "pants" }
  },
  {
    id: 5,
    name: "Baggi Fit Light",
    slug: "baggi-fit-light",
    price: 250,
    image_url: "/Assets/Shop/Shop 4.jpg",
    category: { id: 1, name: "Jeans", slug: "jeans" }
  },
  {
    id: 6,
    name: "Baggi Fit Dark",
    slug: "baggi-fit-dark",
    price: 250,
    image_url: "/Assets/Shop/Shop 5.jpg",
    category: { id: 1, name: "Jeans", slug: "jeans" }
  }
];

// Fallback categories
const FALLBACK_CATEGORIES = [
  { id: 1, name: "Jeans", slug: "jeans" },
  { id: 2, name: "Pants", slug: "pants" }
];

const Shop = () => {
  const { isCartOpen, cartRef, cartBtnRef, openCartMenu, closeCartMenu } = useCartMenu();
  const { isMenuOpen, menuRef, menuBtnRef, openMobileMenu, closeMobileMenu } = useMobileMenu();
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  // Popup state for add-to-cart modal
  const [showAddCartPopup, setShowAddCartPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  // Handle navigation to sections on home page
  const handleSectionNavigation = (sectionId) => {
    navigate('/', { state: { scrollTo: sectionId } });
    closeMobileMenu(); // Close mobile menu after clicking
  };

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch categories
        try {
          const categoriesResponse = await apiService.getCategories();
          if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
            setCategories(categoriesResponse.data);
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
          setCategories(FALLBACK_CATEGORIES);
          setIsUsingFallbackData(true);
        }

        // Fetch products (filtered by category if selected)
        try {
          const productsResponse = await apiService.getProducts(selectedCategory);
          if (productsResponse.data && Array.isArray(productsResponse.data)) {
            setProducts(productsResponse.data);
          } else {
            throw new Error('Invalid products data format');
          }
        } catch (err) {
          console.error('Error fetching products:', err);
          let filteredProducts = FALLBACK_PRODUCTS;
          if (selectedCategory) {
            filteredProducts = FALLBACK_PRODUCTS.filter(
              product => product.category.slug === selectedCategory
            );
          }
          setProducts(filteredProducts);
          setIsUsingFallbackData(true);
        }
      } catch (err) {
        console.error('Error in data fetching:', err);
        setError('Failed to load products. Using local data instead.');
        setCategories(FALLBACK_CATEGORIES);
        setProducts(FALLBACK_PRODUCTS);
        setIsUsingFallbackData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

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


  const handleProductClick = (product) => {
    navigate(`/shop-item?id=${product.id}&slug=${product.slug}`);
  };

  // Open popup when cart icon in image wrapper is clicked
  const handleCartIconClick = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProduct(product);
    setShowAddCartPopup(true);
    setSelectedSize('');
    setIsLoadingSizes(true);

    try {
      // Fetch product details including available sizes
      const response = await apiService.getProductDetail(product.id, product.slug);
      if (response.data && response.data.available_sizes) {
        setAvailableSizes(response.data.available_sizes);
      } else {
        setAvailableSizes([]);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setAvailableSizes([]);
    } finally {
      setIsLoadingSizes(false);
    }
  };

  // Add to cart from popup
  const handleAddToCartFromPopup = async () => {
    if (selectedProduct && selectedSize) {
      try {
        // Find size_id from available sizes
        let sizeId = null;
        if (availableSizes.length > 0) {
          const sizeObject = availableSizes.find(s => s.size && s.size.name === selectedSize);
          if (sizeObject) {
            sizeId = sizeObject.size.id;
          }
        }

        if (!sizeId) {
          console.error('Size ID not found for selected size:', selectedSize);
          return;
        }

        // Create cart item with appropriate structure
        const item = {
          product_id: selectedProduct.id,
          name: selectedProduct.name,
          price: parseFloat(selectedProduct.price),
          image: selectedProduct.image_url || selectedProduct.image,
          image_url: selectedProduct.image_url || selectedProduct.image,
          size: selectedSize,
          size_id: sizeId,
          quantity: 1,
          totalPrice: parseFloat(selectedProduct.price) * 1
        };

        // Add to cart through API
        await apiService.addToCart(
          selectedProduct.id,
          1,
          false
        );

        // Update local cart state
        addToCart(item);

        // Show visual feedback
        const addToCartButton = document.querySelector('.popup-content .btn');
        if (addToCartButton) {
          const originalText = addToCartButton.textContent;
          addToCartButton.textContent = "Added!";
          addToCartButton.style.backgroundColor = "#4CAF50";

          setTimeout(() => {
            addToCartButton.textContent = originalText;
            addToCartButton.style.backgroundColor = "";
          }, 1500);
        }

        setShowAddCartPopup(false);
        setSelectedSize('');
        openCartMenu();
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Show error message to user
        alert('Failed to add item to cart. Please try again.');
      }
    }
  };

  // Close Add to cart popup
  const handleCloseAddCartPopup = () => {
    setShowAddCartPopup(false);
    setSelectedProduct(null);
    setSelectedSize('');
  };

  //Cart Checkout Button
  const handleCheckoutBtn = () => {
    closeCartMenu();
    navigate('/checkout');
  };

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug);
  };

  if (isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <>
      {error && <div className="error-banner">{error}</div>}

      {/* Header */}
      <header className="header" id="Shop-Header">
        <div className="shop-page-navbar">
          <nav className="nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/shop">Shop</Link>
            <a className="nav-link" href="#" onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('About-Us');
            }}>About Us</a>
            <a className="nav-link" href="#" onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('Contact-Us');
            }}>Contact Us</a>
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

      {/* Shop Section */}
      <section className="shop-section">
        <div className="Shop-section-title">
          <h2>Our Collection</h2>
          {isUsingFallbackData && (
            <p className="fallback-notice">
              Note: Using local product data. Connect to backend for live products.
            </p>
          )}
        </div>



        <div className="products-container">
          {products.length === 0 ? (
            <p className="no-products">Out of Stock For Now</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                <div className="product-img-wrapper">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/Assets/Shop/placeholder.jpg';
                    }}
                  />
                  <a
                    href="#"
                    className="cart-icon"
                    onClick={(e) => handleCartIconClick(e, product)}
                  >
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

      {/* Footer Section */}
      <section className="footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src="/Assets/Logos&Icons/denimora-logo-WhiteBg.svg" alt="Denimora Logo" />
          </div>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('About-Us');
            }}>About</a>
            <a href="#" onClick={(e) => {
              e.preventDefault();
              handleSectionNavigation('Contact-Us');
            }}>Contact</a>
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

      {/* Cart Menu */}
      <div className={`cart-menu ${isCartOpen ? 'active' : ''}`} id="cartMenu" ref={cartRef}>
        <div className="close-cart" onClick={closeCartMenu}>&times;</div>
        <div className="cart-content">
          <h2>Your Cart</h2>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p className="empty-cart">Your cart is empty</p>
            ) : (
              cartItems.map((item) => (
                <div key={`${item.product_id || item.name}-${item.size}-${Math.random()}`} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image_url || item.image} alt={item.name} />
                  </div>
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    {item.size && <p>Size: {item.size}</p>}
                    <p>Price: LE {Number(item.price).toFixed(2)}</p>
                    <p>Total: LE {Number(item.totalPrice || (item.price * item.quantity)).toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button onClick={() => {
                        if (item.product_id) {
                          updateQuantity(item.product_id, item.size_id, item.quantity - 1);
                        } else {
                          updateQuantity(item.name, item.size, item.quantity - 1);
                        }
                      }}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => {
                        if (item.product_id) {
                          updateQuantity(item.product_id, item.size_id, item.quantity + 1);
                        } else {
                          updateQuantity(item.name, item.size, item.quantity + 1);
                        }
                      }}>+</button>
                    </div>
                  </div>
                  <button
                    className="remove-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.product_id) {
                        removeFromCart(item.product_id, item.size_id);
                      } else {
                        removeFromCart(item.name, item.size);
                      }
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
              <button className="checkout-btn" onClick={handleCheckoutBtn}>
                Checkout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`} id="mobileMenu" ref={menuRef}>
        <div className="close-menu" onClick={closeMobileMenu}>&times;</div>
        <nav>
          <Link to="/" onClick={closeMobileMenu}>Home</Link>
          <Link to="/shop" onClick={closeMobileMenu}>Shop</Link>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            handleSectionNavigation('About-Us');
            closeMobileMenu();
          }}>About Us</a>
          <a href="#" onClick={(e) => {
            e.preventDefault();
            handleSectionNavigation('Contact-Us');
            closeMobileMenu();
          }}>Contact Us</a>
        </nav>
      </div>

      {/* Add to Cart Popup */}
      {showAddCartPopup && selectedProduct && (
        <div className="popup-overlay" onClick={handleCloseAddCartPopup}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <span className="close-btn" onClick={handleCloseAddCartPopup}>&times;</span>

            <img src={selectedProduct.image_url || selectedProduct.image} alt={selectedProduct.name} className="popup-product-img" />

            <h3>{selectedProduct.name}</h3>
            <p>Price: LE {Number(selectedProduct.price).toFixed(2)}</p>

            <div className="size-btns">
              {isLoadingSizes ? (
                <div className="loading-sizes">Loading sizes...</div>
              ) : selectedProduct.sizes && selectedProduct.sizes.length > 0 && availableSizes.length > 0 ? (
                selectedProduct.sizes.map(sizeObj => {
                  const isAvailable = availableSizes.some(
                    availableSize => availableSize.size.id === sizeObj.id
                  );
                  return (
                    <button
                      key={sizeObj.id}
                      className={`size-btn${selectedSize === sizeObj.name ? ' active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && setSelectedSize(sizeObj.name)}
                      disabled={!isAvailable}
                      type="button"
                    >
                      {sizeObj.name}
                    </button>
                  );
                })
              ) : (
                <div className="no-sizes">Out Of Stock</div>
              )}
            </div>

            <button
              className="btn"
              onClick={handleAddToCartFromPopup}
              disabled={!selectedSize || isLoadingSizes || availableSizes.length === 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Shop;
