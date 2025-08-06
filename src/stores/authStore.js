import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api.client';
import { API_ENDPOINTS, STORAGE_KEYS } from '../config/api.config';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          // Store tokens
          localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
          localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

          // Update state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success(`Welcome back, ${user.name || user.email}!`);
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || 'Login failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);
          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          // Store tokens
          localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
          localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);

          // Update state
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          toast.success('Account created successfully! Welcome aboard! 🎉');
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error?.message || error.response?.data?.error || 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        // Clear tokens
        localStorage.removeItem(STORAGE_KEYS.accessToken);
        localStorage.removeItem(STORAGE_KEYS.refreshToken);

        // Clear state
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });

        toast.success('Logged out successfully');
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put(API_ENDPOINTS.user.updateProfile, profileData);
          const { user } = response.data;

          set({
            user,
            isLoading: false,
            error: null
          });

          toast.success('Profile updated successfully');
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.error || 'Failed to update profile';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      fetchProfile: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.user.profile);
          set({ user: response.data });
          return response.data;
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          return null;
        }
      },

      clearError: () => set({ error: null }),

      // Check if user has a specific plan
      hasPlan: (requiredPlans) => {
        const userPlan = get().user?.subscription?.plan || 'FREE';
        return requiredPlans.includes(userPlan);
      },

      // Get user's current plan
      getCurrentPlan: () => {
        return get().user?.subscription?.plan || 'FREE';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

export default useAuthStore;