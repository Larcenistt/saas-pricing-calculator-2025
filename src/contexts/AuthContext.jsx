import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const register = async (data) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(data);
      toast.success(response.message || 'Registration successful! Please check your email.');
      navigate('/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      const { user: userData } = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success(`Welcome back, ${userData.name || userData.email}!`);
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const forgotPassword = async (email) => {
    try {
      setIsLoading(true);
      const response = await authAPI.forgotPassword(email);
      toast.success(response.message || 'Password reset instructions sent to your email');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to send reset email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.resetPassword(token, password);
      toast.success(response.message || 'Password reset successful');
      navigate('/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to reset password';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyEmail(token);
      toast.success(response.message || 'Email verified successfully');
      navigate('/login');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to verify email';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};