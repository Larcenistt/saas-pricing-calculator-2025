import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api.client';
import toast from 'react-hot-toast';

const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      subscription: null,
      plan: 'FREE',
      planDetails: null,
      usage: null,
      invoices: [],
      isLoading: false,

      // Fetch current subscription
      fetchSubscription: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.get('/subscriptions/current');
          set({
            subscription: response.data.subscription,
            plan: response.data.plan,
            planDetails: response.data.planDetails
          });
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Create checkout session
      createCheckout: async (plan, successUrl, cancelUrl) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/subscriptions/create-checkout', {
            plan,
            successUrl: successUrl || `${window.location.origin}/success`,
            cancelUrl: cancelUrl || `${window.location.origin}/pricing`
          });

          // Redirect to Stripe checkout
          if (response.data.checkoutUrl) {
            window.location.href = response.data.checkoutUrl;
          }
        } catch (error) {
          console.error('Failed to create checkout:', error);
          toast.error('Failed to start checkout process');
        } finally {
          set({ isLoading: false });
        }
      },

      // Cancel subscription
      cancelSubscription: async () => {
        set({ isLoading: true });
        try {
          await apiClient.post('/subscriptions/cancel');
          toast.success('Subscription will be cancelled at the end of the billing period');
          
          // Update local state
          const { subscription } = get();
          if (subscription) {
            set({
              subscription: {
                ...subscription,
                status: 'CANCELLING'
              }
            });
          }
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
          toast.error('Failed to cancel subscription');
        } finally {
          set({ isLoading: false });
        }
      },

      // Resume cancelled subscription
      resumeSubscription: async () => {
        set({ isLoading: true });
        try {
          await apiClient.post('/subscriptions/resume');
          toast.success('Subscription resumed successfully');
          
          // Update local state
          const { subscription } = get();
          if (subscription) {
            set({
              subscription: {
                ...subscription,
                status: 'ACTIVE'
              }
            });
          }
        } catch (error) {
          console.error('Failed to resume subscription:', error);
          toast.error('Failed to resume subscription');
        } finally {
          set({ isLoading: false });
        }
      },

      // Get usage statistics
      fetchUsage: async () => {
        try {
          const response = await apiClient.get('/subscriptions/usage');
          set({ usage: response.data });
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        }
      },

      // Get invoice history
      fetchInvoices: async () => {
        try {
          const response = await apiClient.get('/subscriptions/invoices');
          set({ invoices: response.data.invoices });
        } catch (error) {
          console.error('Failed to fetch invoices:', error);
        }
      },

      // Update payment method
      updatePaymentMethod: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post('/subscriptions/update-payment');
          return response.data.clientSecret;
        } catch (error) {
          console.error('Failed to get payment update intent:', error);
          toast.error('Failed to update payment method');
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      // Check if user has access to feature
      hasAccess: (feature) => {
        const { plan, planDetails } = get();
        
        // Everyone has access to basic features
        if (feature === 'basic') return true;
        
        // Check plan-specific features
        if (plan === 'FREE') {
          return feature === 'pdf_export';
        }
        
        if (plan === 'PROFESSIONAL') {
          return ['unlimited_calculations', 'api_access', 'team', 'analytics'].includes(feature);
        }
        
        if (plan === 'ENTERPRISE') {
          return true; // Enterprise has access to everything
        }
        
        return false;
      },

      // Check if user has reached usage limit
      canUseFeature: (feature) => {
        const { usage, planDetails } = get();
        
        if (!usage || !planDetails) return true;
        
        if (feature === 'calculation') {
          if (planDetails.limits.calculations === -1) return true;
          return usage.usage.calculations < planDetails.limits.calculations;
        }
        
        if (feature === 'api') {
          if (planDetails.limits.apiCalls === -1) return true;
          return usage.usage.apiCalls < planDetails.limits.apiCalls;
        }
        
        return true;
      }
    }),
    {
      name: 'subscription-storage',
      partialize: (state) => ({
        subscription: state.subscription,
        plan: state.plan,
        planDetails: state.planDetails
      })
    }
  )
);

export default useSubscriptionStore;