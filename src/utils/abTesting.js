// A/B Testing utility for pricing experiments
import { trackEvent } from './analytics';

// Get or set the user's test variant
export const getPricingVariant = () => {
  try {
    // Check if user already has a variant assigned
    let variant = localStorage.getItem('pricing_variant');
    
    if (!variant) {
      // Assign new variant (50/50 split)
      variant = Math.random() < 0.5 ? 'control' : 'test';
      localStorage.setItem('pricing_variant', variant);
      localStorage.setItem('variant_assigned_at', new Date().toISOString());
      
      // Track variant assignment
      trackEvent('experiment_assigned', {
        experiment_name: 'pricing_test_79_vs_99',
        variant: variant,
        assigned_at: new Date().toISOString()
      });
    }
    
    return variant;
  } catch (error) {
    // Fallback when localStorage is not available (private browsing, etc.)
    console.warn('localStorage not available, using default variant:', error);
    // Use control variant as default
    return 'control';
  }
};

// Get the price based on variant
export const getPrice = () => {
  const variant = getPricingVariant();
  return variant === 'test' ? 79 : 99;
};

// Get the Stripe button ID based on variant
export const getStripeButtonId = () => {
  const variant = getPricingVariant();
  // A/B Test: $79 (test) vs $99 (control)
  return variant === 'test' 
    ? 'buy_btn_1RssbUI6kujeAM5FN1OF6j9F' // $79 early bird price
    : 'buy_btn_1RqOC7I6kujeAM5FZbqTtxFL'; // $99 regular price
};

// Track conversion based on variant
export const trackPricingConversion = () => {
  const variant = getPricingVariant();
  const price = getPrice();
  
  trackEvent('pricing_conversion', {
    experiment_name: 'pricing_test_79_vs_99',
    variant: variant,
    price: price,
    converted_at: new Date().toISOString()
  });
};

// Get formatted price string
export const getFormattedPrice = () => {
  const price = getPrice();
  const variant = getPricingVariant();
  
  if (variant === 'test') {
    return {
      price: `$${price}`,
      originalPrice: '$99',
      discount: '20% OFF',
      badge: 'EARLY BIRD SPECIAL'
    };
  }
  
  return {
    price: `$${price}`,
    originalPrice: null,
    discount: null,
    badge: null
  };
};

// Check if user is eligible for test (new visitors only)
export const isEligibleForTest = () => {
  const hasVisitedBefore = localStorage.getItem('has_visited');
  if (!hasVisitedBefore) {
    localStorage.setItem('has_visited', 'true');
    return true;
  }
  return false;
};