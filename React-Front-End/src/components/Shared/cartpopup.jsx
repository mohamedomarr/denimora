import React, { useState, useEffect } from "react";
import { useCartMenu } from "../../contexts/CartMenuContext";
import { useCart } from "../../contexts/CartContext";
import apiService from "../../services/api";

const CartPopup = ({ 
  showPopup, 
  selectedProduct, 
  onClose,
  onProductClick = null // Optional prop for when product is clicked from popup
}) => {
  const { openCartMenu } = useCartMenu();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);

  // Fetch available sizes when product changes
  useEffect(() => {
    if (selectedProduct && showPopup) {
      setSelectedSize('');
      setIsLoadingSizes(true);

      const fetchSizes = async () => {
        try {
          const response = await apiService.getProductDetail(selectedProduct.id, selectedProduct.slug);
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

      fetchSizes();
    }
  }, [selectedProduct, showPopup]);

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

        // Add to cart using the updated async method
        await addToCart(item);

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

        onClose();
        setSelectedSize('');
        openCartMenu();
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert(error.message || 'Failed to add item to cart. Please try again.');
      }
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedSize('');
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleProductClick = () => {
    if (onProductClick) {
      onProductClick(selectedProduct);
    }
  };

  if (!showPopup || !selectedProduct) {
    return null;
  }

  return (
    <div className="popup-overlay" onClick={handleOverlayClick}>
      <div className="popup-content" onClick={e => e.stopPropagation()}>
        <span className="close-btn" onClick={handleClose}>
          &times;
        </span>

        <img 
          src={selectedProduct.image_url || selectedProduct.image} 
          alt={selectedProduct.name} 
          className="popup-product-img"
          style={{ cursor: onProductClick ? 'pointer' : 'default' }}
          onClick={onProductClick ? handleProductClick : undefined}
        />

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
  );
};

export default CartPopup;
