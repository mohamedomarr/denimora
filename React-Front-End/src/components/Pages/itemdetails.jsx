import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useSizeChart } from '../../hooks/useSizeChart';
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useMobileMenu } from '../../contexts/MobileMenuContext';
import { useCart } from '../../contexts/CartContext';
import apiService from '../../services/api';
import facebookPixel from '../../services/facebookPixel';
import '../../CSS/bootstrap.css';
import '../../CSS/Styles.css';
import useEmblaCarousel from 'embla-carousel-react';


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
  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  // Embla Carousel states
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [thumbEmblaRef, thumbEmblaApi] = useEmblaCarousel({ containScroll: 'keepSnaps', dragFree: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const productId = searchParams.get('id');
  const productSlug = searchParams.get('slug');
  // Touch/swipe support for modal
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  // Keep these for backward (Fallback) compatibility
  const productName = searchParams.get('name');
  const productPrice = searchParams.get('price');
  const productImage = searchParams.get('image');


  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

            // Track Facebook Pixel ViewContent event
            facebookPixel.trackViewContent({
              id: product.id,
              name: product.name,
              price: product.price,
              slug: product.slug,
              category: { name: 'Jeans' }
            });

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
          
          // Track Facebook Pixel ViewContent event for URL fallback
          facebookPixel.trackViewContent({
            id: productName,
            name: data.name,
            price: data.price,
            category: { name: 'Jeans' }
          });
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
          
          // Track Facebook Pixel ViewContent event for error fallback
          facebookPixel.trackViewContent({
            id: productName,
            name: data.name,
            price: data.price,
            category: { name: 'Jeans' }
          });
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

      if (window.innerWidth < 768) {
        navigate('/cart');
      } else {
        openCartMenu();
      }

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
      if (error.message?.includes('Try again in few minutes')) {
        // Item is reserved by another user - show warning
        showErrorNotification(error.message, 'warning');
      } else if (error.message?.includes('Insufficient stock')) {
        // Insufficient stock - show as error
        showErrorNotification(error.message, 'error');
      } else if (error.message?.includes('out of stock')) {
        // Generic out of stock - show as error
        showErrorNotification(error.message, 'error');
      } else {
        // Other errors - show as error
        showErrorNotification(error.message || 'Failed to add item to cart. Please try again.', 'error');
      }
    }
  };

  const totalPrice = basePrice * quantity;

  // Sync main and thumbnail carousels
  useEffect(() => {
    if (!emblaApi || !thumbEmblaApi) return;
    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      thumbEmblaApi && thumbEmblaApi.scrollTo(emblaApi.selectedScrollSnap());
    });
  }, [emblaApi, thumbEmblaApi]);

  const scrollTo = (idx) => {
    if (emblaApi) emblaApi.scrollTo(idx);
  };

  // Handle image modal
  const openImageModal = (imageIndex = selectedIndex) => {
    setModalImageIndex(imageIndex);
    setIsImageModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent body scroll
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    document.body.style.overflow = 'unset'; // Restore body scroll
    // Sync main carousel with modal when closing
    if (emblaApi && typeof modalImageIndex === 'number' && modalImageIndex !== selectedIndex) {
      emblaApi.scrollTo(modalImageIndex);
    }
  };

  // Modal navigation functions
  const goToPreviousImage = useCallback(() => {
    if (itemData && itemData.detail_images && itemData.detail_images.length > 0) {
      setModalImageIndex((prev) => 
        prev === 0 ? itemData.detail_images.length - 1 : prev - 1
      );
    }
  }, [itemData]);

  const goToNextImage = useCallback(() => {
    if (itemData && itemData.detail_images && itemData.detail_images.length > 0) {
      setModalImageIndex((prev) => 
        prev === itemData.detail_images.length - 1 ? 0 : prev + 1
      );
    }
  }, [itemData]);

  // Handle main image click
  const handleMainImageClick = () => {
    if (itemData && itemData.detail_images && itemData.detail_images.length > 0) {
      openImageModal(selectedIndex);
    }
  };

  const handleTouchStart = useCallback((e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextImage();
    } else if (isRightSwipe) {
      goToPreviousImage();
    }
  }, [touchStart, touchEnd, goToNextImage, goToPreviousImage]);

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isImageModalOpen) {
        if (e.key === 'ArrowLeft') {
          goToPreviousImage();
        } else if (e.key === 'ArrowRight') {
          goToNextImage();
        } else if (e.key === 'Escape') {
          closeImageModal();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isImageModalOpen, goToPreviousImage, goToNextImage]);

  
  if (isLoading) return (
    <div className="page-loading-container">
      <div className="page-loading-content">
        <div className="loading-spinner"></div>
        <h3>Loading {itemData?.name} details...</h3>
        <p>Please wait while we prepare your product information</p>
      </div>
    </div>
  );
  if (error && !itemData) return (
    <div className="page-loading-container">
      <div className="page-loading-content">
        <div className="error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
      </div>
    </div>
  );
  if (!itemData) return null;

  return (
    <>


      {/* Shop Item Section */}
      <section className="shop-item-container">
        <div className="shop-item-img">
          {itemData && itemData.detail_images && itemData.detail_images.length > 0 ? (
            <>
              <div className="embla" ref={emblaRef}>
                <div className="embla__container">
                  {itemData.detail_images.map((img, idx) => (
                    <div className="embla__slide" key={img.id}>
                      <img
                        src={img.image_url}
                        alt={img.alt_text || itemData.name}
                        className="slider-main-img clickable-image"
                        style={{ width: '100%', borderRadius: 8, cursor: 'pointer' }}
                        onClick={handleMainImageClick}
                        title="Click to view larger image"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="embla embla--thumb" ref={thumbEmblaRef} style={{ marginTop: 12 }}>
                <div className="embla__container">
                  {itemData.detail_images.map((img, idx) => (
                    <div
                      className={`embla__slide embla__slide--thumb ${selectedIndex === idx ? 'is-selected' : ''}`}
                      key={img.id}
                      style={{ cursor: 'pointer', padding: 2 }}
                      onClick={() => scrollTo(idx)}
                    >
                      <img
                        src={img.image_url}
                        alt={img.alt_text || itemData.name}
                        className="slider-thumb"
                        style={{ maxWidth: 60, border: selectedIndex === idx ? '2px solid #B59F73' : '2px solid #eee', borderRadius: 8 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : itemData ? (
            <img
              src={itemData?.image}
              alt={itemData?.name}
              id="productImage"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/Assets/Shop/placeholder.jpg';
              }}
            />
          ) : (
            <div className="loading">Loading images...</div>
          )}
        </div>

        <div className="shop-item-content">
          <div className="content-text">
            <h3 id="productName">{itemData?.name || 'Loading...'}</h3>
            <h3>LE {basePrice.toFixed(2)}</h3>
            <p>
              {itemData?.description || `100% cotton of softness and does not contain polyester and elastin,
                High quality due to the methods of fabric and treatment,
                High density fabric (From 12 To 14) ounces for each one,
                Which means a distinctive appearance,
                Average weight,
                Made of Denim Saladge's fabric, which is one of the highest raw materials,
                investment value because it lives for long years,
                The best option for the professionals who appreciate the quality,The bladder, design and luxurious details`}
            </p>

            <div className="size-selection">
              <div className="size-btns">
                {itemData?.sizes && itemData.sizes.length > 0 && availableSizes.length > 0 ? (
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
                  {itemData.description || `100% cotton of softness and does not contain polyester and elastin,
                    High quality due to the methods of fabric and treatment,
                    High density fabric (From 12 To 14) ounces for each one,
                    Which means a distinctive appearance,
                    Average weight,
                    Made of Denim Saladge's fabric, which is one of the highest raw materials,
                    investment value because it lives for long years,
                    The best option for the professionals who appreciate the quality,The bladder, design and luxurious details`}
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

      {/* Image Modal */}
      {isImageModalOpen && itemData && itemData.detail_images && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div 
            className="image-modal-content" 
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button className="image-modal-close" onClick={closeImageModal}>
              &times;
            </button>
            
            {/* Previous Button */}
            {itemData.detail_images.length > 1 && (
              <button className="image-modal-nav image-modal-prev" onClick={goToPreviousImage}>
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
            
            {/* Next Button */}
            {itemData.detail_images.length > 1 && (
              <button className="image-modal-nav image-modal-next" onClick={goToNextImage}>
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
            
            <img 
              src={itemData.detail_images[modalImageIndex]?.image_url} 
              alt={itemData.detail_images[modalImageIndex]?.alt_text || itemData?.name}
              className="image-modal-img"
            />
            
            {/* Image Counter */}
            {itemData.detail_images.length > 1 && (
              <div className="image-modal-counter">
                {modalImageIndex + 1} / {itemData.detail_images.length}
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
};

export default ItemDetails;
