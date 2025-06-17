import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSizeChart } from '../../hooks/useSizeChart';
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { useCart } from '../../contexts/CartContext';
import apiService from '../../services/api';
import '../../CSS/bootstrap.css';
import '../../CSS/Styles.css';

const MAX_VISIBLE_THUMBNAILS = 4;

const ItemDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSizeChartOpen, sizeChartRef, sizeChartBtnRef, openSizeChart, closeSizeChart } = useSizeChart();
  const { openCartMenu } = useCartMenu();
  const { cartItems, addToCart, removeFromCart, updateQuantity, getTotalPrice, showErrorNotification } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [itemData, setItemData] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  // slider states
  const [currentSlide, setCurrentSlide] = useState(0); 
  const [thumbStart, setThumbStart] = useState(0);
  const [dragStartX, setDragStartX] = useState(null);
  const productId = searchParams.get('id');
  const productSlug = searchParams.get('slug');
  // Keep these for backward (Fallback) compatibility
  const productName = searchParams.get('name');
  const productPrice = searchParams.get('price');
  const productImage = searchParams.get('image');

  // Effect to fetch product data from API or URL parameters
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // If we have id and slug, use the API
        if (productId && productSlug) {
          const response = await apiService.getProductDetail(productId, productSlug);
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
              sizes: product.sizes || [],
              detail_images: product.detail_images || [] // <-- add this line
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
            image: productImage
          };
          setItemData(data);
          setBasePrice(data.price);
          document.title = `DENIMORA - ${data.name}`;
        } else {
          // Neither API parameters nor URL parameters available
          navigate('/shop');
          return;
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again later.');

        // If API call fails but we have URL parameters, use those as fallback
        if (productName && productPrice && productImage) {
          const data = {
            name: productName,
            price: parseFloat(productPrice),
            image: productImage
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
  }, [productId, productSlug, productName, productPrice, productImage, navigate]);

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

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      showErrorNotification('Please select a size before adding to cart', 'warning');
      return;
    }

    // Find size_id from available sizes if using API
    let sizeId = null;
    if (itemData.id && availableSizes.length > 0) {
      const sizeObject = availableSizes.find(s =>
        (s.size && s.size.name === selectedSize) || (s.name === selectedSize)
      );
      if (sizeObject) {
        sizeId = sizeObject.size ? sizeObject.size.id : sizeObject.id;
      }
    }

    const item = {
      product_id: itemData.id || null,
      name: itemData.name,
      price: itemData.price,
      image: itemData.image,
      image_url: itemData.image,
      size: selectedSize,
      size_id: sizeId,
      quantity: quantity,
      totalPrice: itemData.price * quantity
    };

    try {
      // Await addToCart in case it's async
      await addToCart(item);

      // Now open the cart menu
      openCartMenu();

      // Show visual feedback
      const addToCartButton = document.querySelector('.add-to-cart button');
      if (addToCartButton) {
        const originalText = addToCartButton.textContent;
        addToCartButton.textContent = "Added!";
        addToCartButton.style.backgroundColor = "#B59F73";
        addToCartButton.style.color = "#28355B";
        setTimeout(() => {
          addToCartButton.textContent = originalText;
          addToCartButton.style.backgroundColor = "";
          addToCartButton.style.color = "";
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Show different notification types based on error message
      if (error.message?.includes('try again in few minutes')) {
        showErrorNotification(error.message, 'warning');
      } else if (error.message?.includes('out of stock')) {
        showErrorNotification(error.message, 'warning');
      } else {
        showErrorNotification(error.message || 'Failed to add item to cart. Please try again.', 'error');
      }
      
      
    }
  };

  const totalPrice = basePrice * quantity;

  // adjust the thumbnail window if needed
  useEffect(() => {
    if (!itemData?.detail_images) return;
    if (currentSlide < thumbStart) {
      setThumbStart(currentSlide);
    } else if (currentSlide >= thumbStart + MAX_VISIBLE_THUMBNAILS) {
      setThumbStart(currentSlide - MAX_VISIBLE_THUMBNAILS + 1);
    }
  }, [currentSlide, itemData]);

  const handleThumbTouchStart = (e) => {
    setDragStartX(e.touches[0].clientX);
  };

  const handleThumbTouchMove = (e) => {
    if (dragStartX === null) return;
    const deltaX = e.touches[0].clientX - dragStartX;
    if (Math.abs(deltaX) > 30) {
      if (deltaX < 0 && thumbStart + MAX_VISIBLE_THUMBNAILS < itemData.detail_images.length) {
        setThumbStart(thumbStart + 1);
      } else if (deltaX > 0 && thumbStart > 0) {
        setThumbStart(thumbStart - 1);
      }
      setDragStartX(null);
    }
  };

  const handleThumbMouseDown = (e) => {
    setDragStartX(e.clientX);
  };

  const handleThumbMouseMove = (e) => {
    if (dragStartX === null) return;
    const deltaX = e.clientX - dragStartX;
    if (Math.abs(deltaX) > 30) {
      if (deltaX < 0 && thumbStart + MAX_VISIBLE_THUMBNAILS < itemData.detail_images.length) {
        setThumbStart(thumbStart + 1);
      } else if (deltaX > 0 && thumbStart > 0) {
        setThumbStart(thumbStart - 1);
      }
      setDragStartX(null);
    }
  };

  const handleThumbMouseUp = () => {
    setDragStartX(null);
  };

  if (isLoading) return <div className="loading">Loading product details...</div>;
  if (error && !itemData) return <div className="error">{error}</div>;
  if (!itemData) return null;

  return (
    <>
      

      {/* Shop Item Section */}
      <section className="shop-item-container">
        <div className="shop-item-img">
          {itemData.detail_images && itemData.detail_images.length > 0 ? (
            <div className="slider-wrapper">
              <img
                src={itemData.detail_images[currentSlide].image}
                alt={itemData.detail_images[currentSlide].alt_text || itemData.name}
                className="slider-main-img"
              />
             
              <div className="slider-thumbnails" style={{ overflow: "hidden", maxWidth: "100%" }}
                onTouchStart={handleThumbTouchStart} 
                onTouchMove={handleThumbTouchMove} 
                onTouchEnd={() => setDragStartX(null)} 
                onMouseDown={handleThumbMouseDown} 
                onMouseMove={handleThumbMouseMove} 
                onMouseUp={handleThumbMouseUp} 
                onMouseLeave={handleThumbMouseUp}>
                {itemData.detail_images
                  .slice(thumbStart, thumbStart + MAX_VISIBLE_THUMBNAILS)
                  .map((img, idx) => {
                    const realIdx = thumbStart + idx;
                    return (
                      <img
                        key={img.id}
                        src={img.image}
                        alt={img.alt_text || itemData.name}
                        className={`slider-thumb ${currentSlide === realIdx ? 'active' : ''}`}
                        style={{
                          cursor: 'pointer',
                          maxWidth: 50,
                          margin: 2
                        }}
                        onClick={() => setCurrentSlide(realIdx)}
                      />
                    );
                  })}
              </div>
            </div>
          ) : (
            <img
              src={itemData.image}
              alt={itemData.name}
              id="productImage"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/Assets/Shop/placeholder.jpg';
              }}
            />
          )}
        </div>

        <div className="shop-item-content">
          <div className="content-text">
            <h3 id="productName">{itemData.name}</h3>
            <h3>LE {basePrice.toFixed(2)}</h3>
            <p>
              {itemData.description || `Denimora
              100% cotton of softness and does not contain polyester and elastin
              2 High quality due to the methods of fabric and treatment
              3 High density fabric (From 12 To 14) ounces for each one
              Which means a distinctive appearance`}
            </p>

            <div className="size-selection">
              <div className="size-btns">
                {itemData.sizes && itemData.sizes.length > 0  && availableSizes.length > 0 ? (
                  // Show all sizes, but disable unavailable ones
                  itemData.sizes.map((sizeObj) => {
                    const isAvailable = availableSizes.some(
                      availableSize => availableSize.size.id === sizeObj.id
                    );
                    return (
                      <button
                        key={sizeObj.id}
                        className={`${selectedSize === sizeObj.name ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                        onClick={() => isAvailable && handleSizeSelect(sizeObj.name)}
                        disabled={!isAvailable}
                      >
                        {sizeObj.name}
                      </button>
                    );
                  })
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
                  <img src="/Assets/SZchrt/Size-Chart-Table.png" alt="Size Chart" />
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
                  {itemData.description || `Denimora
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

          <img src="/Assets/SZchrt/Size-Chart-Table.png" alt="Size Chart" />

          <img src="/Assets/SZchrt/jeans.png" alt="Jeans" />

        </div>
      </div>

     
    </>
  );
};

export default ItemDetails;
