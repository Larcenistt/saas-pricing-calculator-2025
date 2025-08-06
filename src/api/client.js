import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken = localStorage.getItem('accessToken');
let refreshToken = localStorage.getItem('refreshToken');

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        accessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.error?.message || 'An error occurred';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data) => {
    const response = await apiClient.post('/auth/register', data);
    return response;
  },

  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    const { accessToken: token, refreshToken: refresh, user } = response.data;
    
    accessToken = token;
    refreshToken = refresh;
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      accessToken = null;
      refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  verifyEmail: async (token) => {
    return apiClient.get(`/auth/verify-email/${token}`);
  },

  forgotPassword: async (email) => {
    return apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, password) => {
    return apiClient.post(`/auth/reset-password/${token}`, { password });
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    return apiClient.get('/user/profile');
  },

  updateProfile: async (data) => {
    return apiClient.put('/user/profile', data);
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiClient.post('/user/change-password', {
      currentPassword,
      newPassword,
    });
  },

  deleteAccount: async (password) => {
    return apiClient.delete('/user/account', { data: { password } });
  },

  getApiKeys: async () => {
    return apiClient.get('/user/api-keys');
  },

  createApiKey: async (data) => {
    return apiClient.post('/user/api-keys', data);
  },

  deleteApiKey: async (id) => {
    return apiClient.delete(`/user/api-keys/${id}`);
  },
};

// Calculation API
export const calculationAPI = {
  getCalculations: async (teamId) => {
    const params = teamId ? { teamId } : {};
    return apiClient.get('/calculations', { params });
  },

  createCalculation: async (data) => {
    return apiClient.post('/calculations', data);
  },

  getCalculation: async (id) => {
    return apiClient.get(`/calculations/${id}`);
  },

  updateCalculation: async (id, data) => {
    return apiClient.put(`/calculations/${id}`, data);
  },

  deleteCalculation: async (id) => {
    return apiClient.delete(`/calculations/${id}`);
  },

  shareCalculation: async (id) => {
    return apiClient.post(`/calculations/${id}/share`);
  },

  duplicateCalculation: async (id, name) => {
    return apiClient.post(`/calculations/${id}/duplicate`, { name });
  },

  getCalculationVersions: async (id) => {
    return apiClient.get(`/calculations/${id}/versions`);
  },

  exportCalculation: async (id, format) => {
    const response = await apiClient.post(
      `/calculations/${id}/export`,
      { format },
      { responseType: 'blob' }
    );
    return response;
  },

  getSharedCalculation: async (shareToken) => {
    return apiClient.get(`/calculations/shared/${shareToken}`);
  },
};

// Team API
export const teamAPI = {
  getTeams: async () => {
    return apiClient.get('/teams');
  },

  createTeam: async (data) => {
    return apiClient.post('/teams', data);
  },

  updateTeam: async (id, data) => {
    return apiClient.put(`/teams/${id}`, data);
  },

  deleteTeam: async (id) => {
    return apiClient.delete(`/teams/${id}`);
  },

  inviteMember: async (teamId, email, role) => {
    return apiClient.post(`/teams/${teamId}/invite`, { email, role });
  },

  removeMember: async (teamId, userId) => {
    return apiClient.delete(`/teams/${teamId}/members/${userId}`);
  },
};

// Subscription API
export const subscriptionAPI = {
  getSubscription: async () => {
    return apiClient.get('/subscriptions');
  },

  createSubscription: async (data) => {
    return apiClient.post('/subscriptions', data);
  },

  updateSubscription: async (data) => {
    return apiClient.put('/subscriptions', data);
  },

  cancelSubscription: async () => {
    return apiClient.delete('/subscriptions');
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboard: async () => {
    return apiClient.get('/analytics/dashboard');
  },

  getUsageStats: async () => {
    return apiClient.get('/analytics/usage');
  },

  trackEvent: async (eventType, eventData) => {
    return apiClient.post('/analytics/events', { eventType, eventData });
  },
};

export default apiClient;