/**
 * Google Analytics Helper Functions
 * Centralized analytics tracking for the SaaS Pricing Calculator
 */

// Check if gtag is available
const isAnalyticsLoaded = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Safe gtag wrapper
const track = (eventName, parameters = {}) => {
  if (isAnalyticsLoaded()) {
    window.gtag('event', eventName, parameters);
    console.log(`📊 Analytics: ${eventName}`, parameters);
  } else {
    console.warn('⚠️ Analytics not loaded. Event not tracked:', eventName);
  }
};

// Track page views
export const trackPageView = (pagePath) => {
  if (isAnalyticsLoaded()) {
    window.gtag('config', window.GA_MEASUREMENT_ID, {
      page_path: pagePath
    });
  }
};

// Track calculator usage
export const trackCalculatorUse = (metrics) => {
  track('calculator_used', {
    event_category: 'engagement',
    event_label: 'pricing_calculation',
    value: metrics.recommendedPrice || 0
  });
};

// Track PDF export
export const trackPDFExport = (exportType = 'simple') => {
  track('pdf_exported', {
    event_category: 'engagement',
    event_label: exportType,
    value: 1
  });
};

// Track Buy Button click
export const trackBuyButtonClick = () => {
  track('begin_checkout', {
    event_category: 'ecommerce',
    currency: 'USD',
    value: 99.00,
    items: [{
      item_name: 'SaaS Pricing Calculator',
      price: 99.00,
      quantity: 1
    }]
  });
};

// Track successful purchase (call on success page)
export const trackPurchase = (transactionId) => {
  track('purchase', {
    event_category: 'ecommerce',
    transaction_id: transactionId || Date.now().toString(),
    value: 99.00,
    currency: 'USD',
    items: [{
      item_name: 'SaaS Pricing Calculator',
      price: 99.00,
      quantity: 1
    }]
  });
  
  // Also track as conversion
  track('conversion', {
    send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
    value: 99.00,
    currency: 'USD'
  });
};

// Track resource downloads
export const trackResourceDownload = (resourceName) => {
  track('resource_downloaded', {
    event_category: 'engagement',
    event_label: resourceName
  });
};

// Track external link clicks
export const trackExternalLink = (url) => {
  track('external_link_click', {
    event_category: 'outbound',
    event_label: url
  });
};

// Track errors
export const trackError = (errorMessage, errorLocation) => {
  track('exception', {
    description: errorMessage,
    fatal: false,
    error_location: errorLocation
  });
};

// Initialize enhanced ecommerce
export const initializeAnalytics = () => {
  if (isAnalyticsLoaded()) {
    // Set user properties if needed
    window.gtag('set', {
      'currency': 'USD'
    });
    
    console.log('✅ Analytics initialized');
  }
};

// Export all functions
export default {
  trackPageView,
  trackCalculatorUse,
  trackPDFExport,
  trackBuyButtonClick,
  trackPurchase,
  trackResourceDownload,
  trackExternalLink,
  trackError,
  initializeAnalytics
};