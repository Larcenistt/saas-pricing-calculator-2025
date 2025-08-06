// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email'
  },
  
  // User
  user: {
    profile: '/users/profile',
    updateProfile: '/users/profile',
    changePassword: '/users/change-password',
    stats: '/users/stats',
    deleteAccount: '/users/account'
  },
  
  // Calculations
  calculations: {
    list: '/calculations',
    get: (id) => `/calculations/${id}`,
    create: '/calculations',
    update: (id) => `/calculations/${id}`,
    delete: (id) => `/calculations/${id}`,
    share: (id) => `/calculations/${id}/share`,
    getShared: (shareId) => `/calculations/shared/${shareId}`,
    cloneShared: (shareId) => `/calculations/shared/${shareId}/clone`
  },
  
  // Billing
  billing: {
    createCheckout: '/billing/create-checkout',
    customerPortal: '/billing/customer-portal',
    subscription: '/billing/subscription',
    webhook: '/billing/webhook'
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user_data'
};