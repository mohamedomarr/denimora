import axios from 'axios';

// Create an axios instance with defaults
const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Changed back to true to support Django sessions
});

// Debug function to log API activity
const logApiActivity = (message, data) => {
  console.log(`%c API: ${message}`, 'background: #222; color: #bada55', data);
};

// Add a request interceptor to include JWT token in requests
API.interceptors.request.use(
  (config) => {
    logApiActivity(`Request to ${config.url}`, { method: config.method, data: config.data || config.params });
    
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logApiActivity('Request error', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => {
    logApiActivity(`Response from ${response.config.url}`, { status: response.status, data: response.data });
    return response;
  },
  async (error) => {
    // If there's no response, it's likely a network error (CORS, server down, etc.)
    if (!error.response) {
      logApiActivity('Network error (possibly CORS or server down)', error);
      
      // Return a fake response for development to bypass CORS issues
      if (process.env.NODE_ENV === 'development') {
        console.warn('Returning mock data due to possible CORS issue');
        
        // Determine what kind of mock data to return based on the request URL
        const url = error.config.url;
        
        if (url.includes('/orders/create/')) {
          // Add mock response for order creation
          console.warn('Order creation failed due to CORS/network issue, returning mock success');
          return {
            data: {
              id: Date.now(), // Use timestamp as mock ID
              user: null,
              first_name: error.config.data?.first_name || 'Mock',
              last_name: error.config.data?.last_name || 'User',
              email: error.config.data?.email || 'mock@example.com',
              address: error.config.data?.address || 'Mock Address',
              city: error.config.data?.city || 'Mock City',
              postal_code: error.config.data?.postal_code || '00000',
              phone: error.config.data?.phone || '000-000-0000',
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              status: 'pending',
              status_display: 'Pending',
              paid: false,
              items: error.config.data?.items || [],
              total_cost: '0.00'
            }
          };
        }
        
        if (url.includes('/products/')) {
          return {
            data: {
              id: 1,
              name: "Classic Blue Jeans",
              slug: "classic-blue-jeans",
              price: "350.00",
              image_url: "/Assets/Shop/Shop 1.jpg",
              description: "Premium quality denim jeans. 100% cotton, comfortable fit.",
              category: { id: 1, name: "Jeans", slug: "jeans" }
            }
          };
        }
        
        if (url.includes('/products')) {
          return {
            data: [
              {
                id: 1,
                name: "Classic Blue Jeans",
                slug: "classic-blue-jeans",
                price: "350.00",
                image_url: "/Assets/Shop/Shop 1.jpg",
                category: { id: 1, name: "Jeans", slug: "jeans" }
              },
              {
                id: 2,
                name: "Baggi Fit",
                slug: "baggi-fit",
                price: "300.00",
                image_url: "/Assets/Shop/Shop 2.jpg",
                category: { id: 1, name: "Jeans", slug: "jeans" }
              },
              {
                id: 3,
                name: "Wide Leg",
                slug: "wide-leg",
                price: "450.00",
                image_url: "/Assets/Shop/Shop 3.jpg",
                category: { id: 1, name: "Jeans", slug: "jeans" }
              },
              {
                id: 4,
                name: "Straight Leg",
                slug: "straight-leg",
                price: "250.00",
                image_url: "/Assets/Shop/Shop 4.jpg",
                category: { id: 2, name: "Pants", slug: "pants" }
              }
            ]
          };
        }
        
        if (url.includes('/categories')) {
          return {
            data: [
              { id: 1, name: "Jeans", slug: "jeans" },
              { id: 2, name: "Pants", slug: "pants" }
            ]
          };
        }
        
        if (url.includes('/cart')) {
          return {
            data: {
              items: [],
              total_price: "0.00"
            }
          };
        }
      }
    }
    
    logApiActivity('Response error', { 
      status: error.response?.status, 
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 Unauthorized error (token expired)
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, user needs to login again
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Try to get a new access token
        const response = await axios.post('http://localhost:8000/api/token/refresh/', {
          refresh: refreshToken
        });
        
        if (response.data.access) {
          localStorage.setItem('access_token', response.data.access);
          API.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          return API(error.config);
        }
      } catch (refreshError) {
        // Refresh token is invalid or expired
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API methods
const apiService = {
  // Utility methods
  getBaseUrl: () => API.defaults.baseURL,
  
  // Health check
  checkHealth: () => API.get('/health/'),
  
  // Auth endpoints
  login: (credentials) => API.post('/token/', credentials),
  refreshToken: (refresh) => API.post('/token/refresh/', { refresh }),
  register: (userData) => API.post('/users/register/', userData),
  getUserProfile: () => API.get('/users/profile/'),
  updateUserProfile: (data) => API.put('/users/profile/update/', data),
  
  // Products
  getProducts: (category = null) => {
    const params = category ? { category } : {};
    return API.get('/products/', { params });
  },
  getProductDetail: (id, slug) => API.get(`/products/${id}/${slug}/`),
  getCategories: () => API.get('/products/categories/'),
  
  // Cart
  getCart: () => API.get('/cart/'),
  addToCart: (productId, quantity, overrideQuantity = false) => 
    API.post('/cart/add/', { product_id: productId, quantity, override_quantity: overrideQuantity }),
  removeFromCart: (productId) => API.delete('/cart/remove/', { data: { product_id: productId } }),
  clearCart: () => API.post('/cart/clear/'),
  
  // Orders
  getOrders: () => API.get('/orders/'),
  getOrderDetail: (id) => API.get(`/orders/${id}/`),
  createOrder: (orderData) => API.post('/orders/create/', orderData),
  
  // Shipping costs - NEW
  getShippingCost: (governorate) => {
    const params = { governorate };
    return API.get('/orders/shipping-cost/', { params });
  },
  getGovernoratesShipping: () => API.get('/orders/governorates/'),
};

export default apiService; 