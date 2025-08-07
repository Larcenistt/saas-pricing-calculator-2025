// Tier-specific features and access control
export const TIER_FEATURES = {
  starter: {
    name: 'Starter',
    calculations: 5, // Max saved calculations
    exports: {
      pdf: true,
      excel: false,
      googleSheets: false,
      api: false
    },
    sharing: {
      enabled: false,
      maxShares: 0
    },
    ai: {
      enabled: false,
      monthlyCredits: 0
    },
    templates: {
      enabled: true,
      count: 1 // Basic template only
    },
    branding: {
      customLogo: false,
      whiteLabel: false,
      customColors: false
    },
    collaboration: {
      enabled: false,
      maxSeats: 1
    },
    support: {
      type: 'email',
      responseTime: '48 hours'
    },
    analytics: {
      basic: true,
      advanced: false,
      export: false
    }
  },
  
  professional: {
    name: 'Professional',
    calculations: -1, // Unlimited
    exports: {
      pdf: true,
      excel: true,
      googleSheets: true,
      api: false
    },
    sharing: {
      enabled: true,
      maxShares: -1, // Unlimited
      customUrls: true,
      passwordProtection: true
    },
    ai: {
      enabled: true,
      monthlyCredits: 100,
      features: [
        'pricing_recommendations',
        'competitor_analysis',
        'market_insights',
        'optimization_suggestions'
      ]
    },
    templates: {
      enabled: true,
      count: 10, // Industry-specific templates
      custom: true
    },
    branding: {
      customLogo: true,
      whiteLabel: false,
      customColors: true,
      customFonts: true
    },
    collaboration: {
      enabled: true,
      maxSeats: 3,
      realTime: true,
      comments: true
    },
    support: {
      type: 'priority',
      responseTime: '4 hours',
      liveChat: true
    },
    analytics: {
      basic: true,
      advanced: true,
      export: true,
      customReports: true
    }
  },
  
  enterprise: {
    name: 'Enterprise',
    calculations: -1, // Unlimited
    exports: {
      pdf: true,
      excel: true,
      googleSheets: true,
      api: true,
      webhook: true
    },
    sharing: {
      enabled: true,
      maxShares: -1,
      customUrls: true,
      passwordProtection: true,
      expiringLinks: true,
      analytics: true
    },
    ai: {
      enabled: true,
      monthlyCredits: -1, // Unlimited
      features: [
        'pricing_recommendations',
        'competitor_analysis',
        'market_insights',
        'optimization_suggestions',
        'custom_models',
        'api_access'
      ]
    },
    templates: {
      enabled: true,
      count: -1, // Unlimited
      custom: true,
      shared: true // Team templates
    },
    branding: {
      customLogo: true,
      whiteLabel: true,
      customColors: true,
      customFonts: true,
      customDomain: true
    },
    collaboration: {
      enabled: true,
      maxSeats: -1, // Unlimited
      realTime: true,
      comments: true,
      roles: true, // Role-based access
      audit: true // Audit trail
    },
    support: {
      type: 'dedicated',
      responseTime: '1 hour',
      liveChat: true,
      phone: true,
      accountManager: true,
      training: true
    },
    analytics: {
      basic: true,
      advanced: true,
      export: true,
      customReports: true,
      api: true,
      whiteLabel: true
    },
    security: {
      sso: true,
      mfa: true,
      ipWhitelist: true,
      dataEncryption: true,
      sla: true
    }
  }
};

// Check if user has access to a feature
export function hasAccess(userTier, feature, subFeature = null) {
  const tier = TIER_FEATURES[userTier] || TIER_FEATURES.starter;
  
  if (!tier[feature]) return false;
  
  if (subFeature) {
    return tier[feature][subFeature] === true || tier[feature][subFeature] === -1;
  }
  
  return tier[feature].enabled === true;
}

// Get user's tier from localStorage or session
export function getUserTier() {
  // Check localStorage for tier
  const storedTier = localStorage.getItem('user_tier');
  if (storedTier) return storedTier;
  
  // Check if user has made a purchase (from Stripe success)
  const purchaseData = localStorage.getItem('purchase_data');
  if (purchaseData) {
    const data = JSON.parse(purchaseData);
    return data.tier || 'starter';
  }
  
  // Default to starter for demo
  return 'starter';
}

// Set user's tier after purchase
export function setUserTier(tier) {
  localStorage.setItem('user_tier', tier);
  
  // Track tier upgrade
  if (window.gtag) {
    window.gtag('event', 'tier_upgraded', {
      tier: tier,
      value: getTierPrice(tier)
    });
  }
}

// Get tier price for analytics
function getTierPrice(tier) {
  const prices = {
    starter: 99,
    professional: 199,
    enterprise: 499
  };
  return prices[tier] || 0;
}

// Feature gates for UI
export function FeatureGate({ tier, feature, children, fallback = null }) {
  const userTier = getUserTier();
  const hasFeatureAccess = hasAccess(userTier, feature);
  
  if (hasFeatureAccess) {
    return children;
  }
  
  return fallback || (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <p className="text-gray-400 text-sm">
        This feature requires {tier} tier or higher.
      </p>
      <a href="#pricing" className="text-emerald-400 hover:text-emerald-300 text-sm">
        Upgrade now →
      </a>
    </div>
  );
}

// Get tier-specific limits
export function getTierLimit(feature, userTier = null) {
  const tier = TIER_FEATURES[userTier || getUserTier()];
  
  switch(feature) {
    case 'calculations':
      return tier.calculations;
    case 'seats':
      return tier.collaboration.maxSeats;
    case 'ai_credits':
      return tier.ai.monthlyCredits;
    case 'templates':
      return tier.templates.count;
    default:
      return null;
  }
}

// Check if user is approaching tier limits
export function checkTierLimits() {
  const userTier = getUserTier();
  const tier = TIER_FEATURES[userTier];
  const warnings = [];
  
  // Check saved calculations limit
  if (tier.calculations !== -1) {
    const savedCalcs = JSON.parse(localStorage.getItem('saved_calculations') || '[]');
    if (savedCalcs.length >= tier.calculations * 0.8) {
      warnings.push({
        type: 'calculations',
        message: `You're approaching your limit of ${tier.calculations} saved calculations`,
        action: 'upgrade'
      });
    }
  }
  
  // Check AI credits if applicable
  if (tier.ai.enabled && tier.ai.monthlyCredits !== -1) {
    const usedCredits = parseInt(localStorage.getItem('ai_credits_used') || '0');
    if (usedCredits >= tier.ai.monthlyCredits * 0.8) {
      warnings.push({
        type: 'ai_credits',
        message: `You've used ${usedCredits} of ${tier.ai.monthlyCredits} AI credits this month`,
        action: 'upgrade'
      });
    }
  }
  
  return warnings;
}

// Export functions for different tiers
export function exportToPDFWithBranding(data, userTier) {
  const tier = TIER_FEATURES[userTier || getUserTier()];
  
  if (tier.branding.customLogo) {
    // Add custom logo to PDF
    data.logo = localStorage.getItem('custom_logo') || null;
  }
  
  if (tier.branding.whiteLabel) {
    // Remove all WealthFlow branding
    data.whiteLabel = true;
  }
  
  if (tier.branding.customColors) {
    // Apply custom colors
    data.colors = JSON.parse(localStorage.getItem('custom_colors') || '{}');
  }
  
  return data;
}

// Initialize tier features on app load
export function initializeTierFeatures() {
  // Check for tier upgrade from URL params (after Stripe redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const purchasedTier = urlParams.get('tier');
  
  if (purchasedTier) {
    setUserTier(purchasedTier);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Show tier limit warnings if any
  const warnings = checkTierLimits();
  if (warnings.length > 0) {
    // Display warnings to user
    console.log('Tier limit warnings:', warnings);
  }
  
  // Initialize tier-specific features
  const userTier = getUserTier();
  console.log(`User tier: ${userTier}`);
  
  return userTier;
}