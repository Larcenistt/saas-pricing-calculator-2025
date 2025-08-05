/**
 * Referral Tracking Utility
 * Handles referral code detection and tracking
 */

// Check and store referral code from URL
export const checkReferralCode = () => {
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  
  if (refCode) {
    // Store referral code
    sessionStorage.setItem('referral_code_used', refCode);
    
    // Track referral click (in production, send to backend)
    const referralClicks = JSON.parse(localStorage.getItem('referral_clicks') || '{}');
    referralClicks[refCode] = (referralClicks[refCode] || 0) + 1;
    localStorage.setItem('referral_clicks', JSON.stringify(referralClicks));
    
    // Show toast notification
    if (window.toast) {
      window.toast.success('🎉 $20 discount applied from referral!');
    }
    
    // Track in analytics
    if (window.gtag) {
      window.gtag('event', 'referral_click', {
        event_category: 'referral',
        event_label: refCode
      });
    }
    
    console.log('Referral code detected:', refCode);
    return refCode;
  }
  
  return null;
};

// Apply referral discount to price
export const applyReferralDiscount = (originalPrice) => {
  const refCode = sessionStorage.getItem('referral_code_used');
  if (refCode) {
    const discount = 20; // $20 off
    return Math.max(originalPrice - discount, 0);
  }
  return originalPrice;
};

// Track referral conversion
export const trackReferralConversion = (refCode, purchaseAmount) => {
  if (!refCode) return;
  
  // In production, send to backend
  // For now, store locally
  const conversions = JSON.parse(localStorage.getItem('referral_conversions') || '{}');
  if (!conversions[refCode]) {
    conversions[refCode] = [];
  }
  
  conversions[refCode].push({
    date: new Date().toISOString(),
    amount: purchaseAmount,
    commission: 20 // $20 commission
  });
  
  localStorage.setItem('referral_conversions', JSON.stringify(conversions));
  
  // Update referrer's stats
  updateReferrerStats(refCode);
  
  // Track in analytics
  if (window.gtag) {
    window.gtag('event', 'referral_conversion', {
      event_category: 'referral',
      event_label: refCode,
      value: purchaseAmount
    });
  }
};

// Update referrer's statistics
const updateReferrerStats = (refCode) => {
  const myCode = localStorage.getItem('referral_code');
  if (myCode === refCode) {
    // Update own stats
    const stats = JSON.parse(localStorage.getItem('referral_stats') || '{"clicks":0,"signups":0,"purchases":0,"earned":0}');
    stats.purchases += 1;
    stats.earned += 20;
    localStorage.setItem('referral_stats', JSON.stringify(stats));
  }
};

// Get referral discount amount
export const getReferralDiscount = () => {
  const refCode = sessionStorage.getItem('referral_code_used');
  return refCode ? 20 : 0;
};

// Initialize referral tracking
export const initReferralTracking = () => {
  // Ensure we're in browser environment
  if (typeof window === 'undefined') return;
  
  // Delay initialization to ensure DOM is ready
  setTimeout(() => {
    // Check for referral code on page load
    checkReferralCode();
    
    // Listen for successful purchases
    window.addEventListener('purchase_complete', (event) => {
      const refCode = sessionStorage.getItem('referral_code_used');
      if (refCode && event.detail) {
        trackReferralConversion(refCode, event.detail.amount);
      }
    });
  }, 0);
};