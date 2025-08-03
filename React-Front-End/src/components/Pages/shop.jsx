import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartMenu } from '../../contexts/CartMenuContext';
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCartPopup } from '../Layout/MainLayout';
import ProgressBarManager from '../Shared/ProgressBarManager';
import apiService from '../../services/api';
import '../../CSS/bootstrap.css';
import '../../CSS/Styles.css';

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
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { handleCartIconClick } = useCartPopup();
  const navigate = useNavigate();

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const handleCategoryClick = (slug) => {
    setSelectedCategory(slug);
  };

  if (isLoading) {
    // return (
    //   <div className="page-loading-container">
    //     <div className="page-loading-content">
    //       <div className="loading-spinner"></div>
    //       <h3>Loading products...</h3>
    //       <p>Please wait while loading the latest collection</p>
    //     </div>
    //   </div>
    // );
  }

  return (
    <ProgressBarManager loadingState={isLoading} autoStartDelay={600}>
      {error && <div className="error-banner">{error}</div>}

      {/* Shop Section */}
      <section className="shop-section shop-page-section">
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
    </ProgressBarManager>
  );
};

export default Shop;
