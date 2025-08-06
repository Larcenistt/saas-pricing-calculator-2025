import { create } from 'zustand';
import apiClient from '../services/api.client';
import { API_ENDPOINTS } from '../config/api.config';
import toast from 'react-hot-toast';

const useCalculationStore = create((set, get) => ({
  // State
  calculations: [],
  currentCalculation: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },

  // Actions
  fetchCalculations: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_ENDPOINTS.calculations.list, { params });
      
      set({
        calculations: response.data.calculations,
        pagination: response.data.pagination,
        isLoading: false,
        error: null
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch calculations';
      set({
        isLoading: false,
        error: errorMessage
      });
      return null;
    }
  },

  fetchCalculation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_ENDPOINTS.calculations.get(id));
      
      set({
        currentCalculation: response.data,
        isLoading: false,
        error: null
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  saveCalculation: async (calculationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.calculations.create,
        calculationData
      );

      // Add to list
      set(state => ({
        calculations: [response.data, ...state.calculations],
        currentCalculation: response.data,
        isLoading: false,
        error: null
      }));

      toast.success('Calculation saved successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to save calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      
      // Show specific error for plan limits
      if (error.response?.status === 403) {
        toast.error('You\'ve reached your plan limit. Upgrade to save more calculations!', {
          duration: 5000,
          icon: '⚠️'
        });
      } else {
        toast.error(errorMessage);
      }
      
      return null;
    }
  },

  updateCalculation: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.calculations.update(id),
        updates
      );

      // Update in list
      set(state => ({
        calculations: state.calculations.map(calc =>
          calc.id === id ? response.data : calc
        ),
        currentCalculation: response.data,
        isLoading: false,
        error: null
      }));

      toast.success('Calculation updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  deleteCalculation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(API_ENDPOINTS.calculations.delete(id));

      // Remove from list
      set(state => ({
        calculations: state.calculations.filter(calc => calc.id !== id),
        currentCalculation: state.currentCalculation?.id === id ? null : state.currentCalculation,
        isLoading: false,
        error: null
      }));

      toast.success('Calculation deleted');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return false;
    }
  },

  shareCalculation: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.calculations.share(id),
        { isPublic: true }
      );

      // Update in list
      set(state => ({
        calculations: state.calculations.map(calc =>
          calc.id === id ? { ...calc, ...response.data } : calc
        ),
        isLoading: false,
        error: null
      }));

      // Copy share URL to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(response.data.shareUrl);
        toast.success('Share link copied to clipboard!');
      } else {
        toast.success('Calculation shared successfully!');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to share calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  loadSharedCalculation: async (shareId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.calculations.getShared(shareId)
      );

      set({
        currentCalculation: response.data,
        isLoading: false,
        error: null
      });

      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to load shared calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  cloneSharedCalculation: async (shareId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.calculations.cloneShared(shareId)
      );

      // Add to list
      set(state => ({
        calculations: [response.data, ...state.calculations],
        currentCalculation: response.data,
        isLoading: false,
        error: null
      }));

      toast.success('Calculation cloned to your account!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to clone calculation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  clearCurrentCalculation: () => {
    set({ currentCalculation: null });
  },

  clearError: () => {
    set({ error: null });
  }
}));

export default useCalculationStore;