import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe configuration
export const STRIPE_CONFIG = {
  // LIVE Price ID for SaaS Pricing Calculator 2025 - $99
  priceId: 'price_1RqM2iI6kujeAM5FvCU5Cxy7',
  successUrl: `${window.location.origin}/success`,
  cancelUrl: `${window.location.origin}/`,
};