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

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        let categoriesData = [];
        try {
          const categoriesResponse = await apiService.getCategories();
          if (categoriesResponse.data) {
            categoriesData = categoriesResponse.data;
            setCategories(categoriesData);
          }
        } catch (err) {
          console.error('Error fetching categories:', err);
          // Use fallback categories
          categoriesData = FALLBACK_CATEGORIES;
          setCategories(FALLBACK_CATEGORIES);
          setIsUsingFallbackData(true);
        }

        // Fetch products (filtered by category if selected)
        try {
          const productsResponse = await apiService.getProducts(selectedCategory);
          if (productsResponse.data) {
            setProducts(productsResponse.data);
          }
        } catch (err) {
          console.error('Error fetching products:', err);
          // Use fallback products, filtered by category if needed
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
        // Use all fallback data
        setCategories(FALLBACK_CATEGORIES);
        setProducts(FALLBACK_PRODUCTS);
        setIsUsingFallbackData(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  const handleProductClick = (product) => {
    navigate(`/shop-item?id=${product.id}&slug=${product.slug}`);
  };

  const handleCartClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
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
          {isAuthenticated ? (
            <div className="user-icon">
              <i className="fas fa-user"></i>
              <span>{user.username}</span>
            </div>
          ) : (
            <Link to="/login" className="login-link">Login</Link>
          )}
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

        {/* Categories filter */}
        {categories.length > 0 && (
          <div className="categories-filter">
            <button 
              className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              All
            </button>
            {categories.map(category => (
              <button 
                key={category.id}
                className={`category-btn ${selectedCategory === category.slug ? 'active' : ''}`}
                onClick={() => handleCategoryClick(category.slug)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <div className="products-container">
          {products.length === 0 ? (
            <p className="no-products">No products found</p>
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
                    onClick={(e) => handleCartClick(e, product)}
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
                    <p>Total: LE {Number(item.total_price || (item.price * item.quantity)).toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button onClick={() => item.product_id 
                        ? updateQuantity(item.product_id, item.quantity - 1)
                        : updateQuantity(item.name, item.size, item.quantity - 1)
                      }>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => item.product_id 
                        ? updateQuantity(item.product_id, item.quantity + 1)
                        : updateQuantity(item.name, item.size, item.quantity + 1)
                      }>+</button>
                    </div>
                  </div>
                  <button 
                    className="remove-item" 
                    onClick={(e) => {
                      e.stopPropagation();
                      item.product_id 
                        ? removeFromCart(item.product_id)
                        : removeFromCart(item.name, item.size);
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
