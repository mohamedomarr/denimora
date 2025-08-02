// Facebook Pixel Utility Service for Denimora E-commerce Tracking

class FacebookPixelService {
  constructor() {
    this.pixelId = '2478145799231153';
    this.isEnabled = typeof window !== 'undefined' && window.fbq;
    this.hasInitialized = false;
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.eventQueue = new Set(); // Track recent events to prevent duplicates
  }

  // Check if Facebook Pixel is loaded
  isPixelLoaded() {
    return this.isEnabled && typeof window.fbq === 'function';
  }

  // Prevent duplicate events (especially useful in development with StrictMode)
  preventDuplicateEvent(eventName, eventData = {}) {
    if (!this.isDevelopment) return false; // Only apply in development
    
    const eventSignature = `${eventName}_${JSON.stringify(eventData)}_${Date.now()}`;
    const recentSignature = `${eventName}_${JSON.stringify(eventData)}`;
    
    // Check if this exact event was sent in the last 1 second
    if (this.eventQueue.has(recentSignature)) {
      console.log(`Facebook Pixel: Duplicate ${eventName} prevented`);
      return true; // Prevent duplicate
    }
    
    // Add to queue and remove after 1 second
    this.eventQueue.add(recentSignature);
    setTimeout(() => {
      this.eventQueue.delete(recentSignature);
    }, 1000);
    
    return false; // Allow event
  }

  // Track page views (use sparingly - base pixel already sends automatic PageView)
  trackPageView(pageName = null) {
    if (!this.isPixelLoaded()) return;
    
    // Add a small delay to avoid conflicts with automatic PageView
    setTimeout(() => {
      if (pageName) {
        window.fbq('track', 'PageView', { page_name: pageName });
      } else {
        window.fbq('track', 'PageView');
      }
    }, 100);
  }

  // Track product view
  trackViewContent(product) {
    if (!this.isPixelLoaded() || !product) return;

    const eventData = {
      content_ids: [product.id || product.slug],
      content_type: 'product',
      content_name: product.name,
      content_category: product.category?.name || 'Jeans',
      value: parseFloat(product.price),
      currency: 'EGP'
    };

    // Prevent duplicates in development
    if (this.preventDuplicateEvent('ViewContent', eventData)) return;

    window.fbq('track', 'ViewContent', eventData);

    console.log('Facebook Pixel: ViewContent tracked', product.name);
  }

  // Track add to cart
  trackAddToCart(product, quantity = 1) {
    if (!this.isPixelLoaded() || !product) return;

    const eventData = {
      content_ids: [product.id || product.slug],
      content_type: 'product',
      content_name: product.name,
      content_category: product.category?.name || 'Jeans',
      value: parseFloat(product.price) * quantity,
      currency: 'EGP',
      num_items: quantity
    };

    // Prevent duplicates in development
    if (this.preventDuplicateEvent('AddToCart', eventData)) return;

    window.fbq('track', 'AddToCart', eventData);

    console.log('Facebook Pixel: AddToCart tracked', product.name, 'Qty:', quantity);
  }

  // Track initiate checkout
  trackInitiateCheckout(cartItems, totalValue) {
    if (!this.isPixelLoaded() || !cartItems?.length) return;

    const contentIds = cartItems.map(item => item.id || item.slug || item.name);
    const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    window.fbq('track', 'InitiateCheckout', {
      content_ids: contentIds,
      content_type: 'product',
      value: parseFloat(totalValue),
      currency: 'EGP',
      num_items: totalItems
    });

    console.log('Facebook Pixel: InitiateCheckout tracked', 'Items:', totalItems, 'Value:', totalValue);
  }

  // Track purchase
  trackPurchase(orderData) {
    if (!this.isPixelLoaded() || !orderData) return;

    const { items, total, orderId } = orderData;
    const contentIds = items?.map(item => item.id || item.slug || item.name) || [];
    const totalItems = items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    window.fbq('track', 'Purchase', {
      content_ids: contentIds,
      content_type: 'product',
      value: parseFloat(total),
      currency: 'EGP',
      num_items: totalItems,
      order_id: orderId
    });

    console.log('Facebook Pixel: Purchase tracked', 'Order:', orderId, 'Value:', total);
  }

  // Track search
  trackSearch(searchQuery, resultCount = null) {
    if (!this.isPixelLoaded() || !searchQuery) return;

    const eventData = {
      search_string: searchQuery,
      content_type: 'product'
    };

    if (resultCount !== null) {
      eventData.num_results = resultCount;
    }

    window.fbq('track', 'Search', eventData);

    console.log('Facebook Pixel: Search tracked', searchQuery);
  }

  // Track contact form submission
  trackContact(contactType = 'general') {
    if (!this.isPixelLoaded()) return;

    window.fbq('track', 'Contact', {
      contact_type: contactType
    });

    console.log('Facebook Pixel: Contact tracked', contactType);
  }

  // Track newsletter signup (if you have one)
  trackLead(source = 'newsletter') {
    if (!this.isPixelLoaded()) return;

    window.fbq('track', 'Lead', {
      lead_source: source
    });

    console.log('Facebook Pixel: Lead tracked', source);
  }

  // Custom event tracking
  trackCustomEvent(eventName, eventData = {}) {
    if (!this.isPixelLoaded()) return;

    window.fbq('trackCustom', eventName, eventData);

    console.log('Facebook Pixel: Custom event tracked', eventName, eventData);
  }
}

// Create and export a singleton instance
const facebookPixel = new FacebookPixelService();
export default facebookPixel; 