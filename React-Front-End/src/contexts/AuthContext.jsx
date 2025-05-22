import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (token exists)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Verify token by getting user profile
          const response = await apiService.getUserProfile();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Token might be invalid, remove it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    setError(null);
    try {
      const response = await apiService.login({ username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Get user profile
      const profileResponse = await apiService.getUserProfile();
      setUser(profileResponse.data);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      await apiService.register(userData);
      // Auto login after registration
      return await login(userData.username, userData.password);
    } catch (error) {
      setError(error.response?.data || 'Registration failed. Please try again.');
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      isLoading,
      error,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 