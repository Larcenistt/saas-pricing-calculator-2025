import { useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import { trackEvent } from '../utils/analytics';

const stripePromise = loadStripe('pk_live_51PsyMBI6kujeAM5FZfLJiS8RxEV49oCnJEGYvh2X1TaKz1PsOjEBJzStQhEpdKPXOiaHx0pcwSXBOv5NBbSSgHdS00aQahHq1x');

export default function TieredPricingPremium() {
  const [loadingTier, setLoadingTier] = useState(null);
  const [billingCycle, setBillingCycle] = useState('onetime');
  
  const tiers = [
    {
      name: 'Starter',
      price: { onetime: 99, subscription: 29 },
      originalPrice: { onetime: 299, subscription: 49 },
      description: 'Perfect for bootstrapped startups',
      features: [
        '✨ Core Pricing Calculator',
        '📊 Basic SaaS Metrics',
        '📄 PDF Export (Standard)',
        '💾 Save 5 Calculations',
        '📧 Email Support',
        '🔄 30-Day Guarantee'
      ],
      limitations: [
        'Single User',
        'No Team Sharing',
        'No AI Insights'
      ],
      buttonText: 'Get Started',
      stripeProductId: 'price_starter_99', // Replace with actual Stripe price ID
      stripeBuyButton: 'buy_btn_1RqOC7I6kujeAM5FZbqTtxFL', // Existing button
      popular: false,
      value: 'starter'
    },
    {
      name: 'Professional',
      price: { onetime: 199, subscription: 59 },
      originalPrice: { onetime: 599, subscription: 99 },
      description: 'For growing SaaS companies',
      features: [
        '✅ Everything in Starter',
        '🤖 AI-Powered Insights',
        '📈 Advanced Analytics',
        '👥 Team Sharing (3 seats)',
        '📑 Excel + Google Sheets Export',
        '💾 Unlimited Calculations',
        '🎨 Custom Report Branding',
        '⚡ Priority Support',
        '🔗 Shareable URLs'
      ],
      limitations: [],
      buttonText: 'Go Professional',
      stripeProductId: 'price_professional_199', // Create in Stripe
      stripeBuyButton: 'buy_btn_professional_NEW', // Create in Stripe
      popular: true,
      savings: 'BEST VALUE - Save $400',
      value: 'professional'
    },
    {
      name: 'Enterprise',
      price: { onetime: 499, subscription: 149 },
      originalPrice: { onetime: 1999, subscription: 299 },
      description: 'For established businesses',
      features: [
        '🚀 Everything in Professional',
        '♾️ Unlimited Team Seats',
        '🏷️ White-Label Reports',
        '🔌 API Access',
        '📊 Custom Integrations',
        '👤 Dedicated Account Manager',
        '🎓 1-on-1 Training Session',
        '📋 Quarterly Reviews',
        '🛡️ SLA Guarantee',
        '🏢 Invoice Billing'
      ],
      limitations: [],
      buttonText: 'Go Enterprise',
      stripeProductId: 'price_enterprise_499', // Create in Stripe
      stripeBuyButton: 'buy_btn_enterprise_NEW', // Create in Stripe
      popular: false,
      enterprise: true,
      savings: 'Save $1,500',
      value: 'enterprise'
    }
  ];

  const handlePurchase = async (tier) => {
    setLoadingTier(tier.value);
    
    // Track pricing tier selection
    trackEvent('pricing_tier_selected', {
      tier: tier.name,
      price: tier.price[billingCycle],
      billing: billingCycle
    });

    try {
      // For Starter tier, use existing Stripe button
      if (tier.value === 'starter') {
        // Check if the Stripe buy button exists
        const buyButton = document.querySelector(`stripe-buy-button[buy-button-id="${tier.stripeBuyButton}"]`);
        if (buyButton) {
          // Trigger click on the actual Stripe button
          buyButton.click();
        } else {
          // Fallback: Create Stripe checkout session
          await createCheckoutSession(tier);
        }
      } else if (tier.value === 'professional') {
        // For Professional tier, create enhanced checkout
        await createProfessionalCheckout(tier);
      } else if (tier.value === 'enterprise') {
        // For Enterprise, create enterprise checkout or calendly
        await createEnterpriseCheckout(tier);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const createCheckoutSession = async (tier) => {
    const stripe = await stripePromise;
    
    // Create checkout session via your backend
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: tier.stripeProductId,
        tierName: tier.name,
        billingCycle
      })
    });

    const session = await response.json();
    
    // Redirect to Stripe Checkout
    const result = await stripe.redirectToCheckout({
      sessionId: session.id
    });

    if (result.error) {
      toast.error(result.error.message);
    }
  };

  const createProfessionalCheckout = async (tier) => {
    // Track professional tier interest
    trackEvent('professional_tier_clicked', {
      price: tier.price[billingCycle]
    });

    // For now, show value proposition and use Starter checkout
    const confirmUpgrade = window.confirm(
      `🚀 Professional Tier - $${tier.price[billingCycle]}\n\n` +
      `✨ Includes AI-Powered Insights\n` +
      `📊 Advanced Analytics Dashboard\n` +
      `👥 Team Collaboration (3 seats)\n` +
      `📑 Excel & Google Sheets Export\n` +
      `🎨 Custom Branded Reports\n\n` +
      `Ready to unlock professional features?`
    );

    if (confirmUpgrade) {
      // Temporarily redirect to Starter with a note
      toast.success('Professional tier launching soon! Get started with Starter and we\'ll upgrade you automatically.');
      
      // Use starter checkout but mark as professional intent
      localStorage.setItem('upgrade_intent', 'professional');
      
      // Click the starter button
      const starterButton = document.querySelector(`stripe-buy-button[buy-button-id="${tiers[0].stripeBuyButton}"]`);
      if (starterButton) {
        starterButton.click();
      }
    }
  };

  const createEnterpriseCheckout = async (tier) => {
    // Track enterprise tier interest
    trackEvent('enterprise_tier_clicked', {
      price: tier.price[billingCycle]
    });

    // Show enterprise contact form
    const confirmEnterprise = window.confirm(
      `🏢 Enterprise Tier - $${tier.price[billingCycle]}\n\n` +
      `♾️ Unlimited Team Seats\n` +
      `🏷️ White-Label Options\n` +
      `🔌 Full API Access\n` +
      `👤 Dedicated Account Manager\n` +
      `🎓 Custom Training Session\n\n` +
      `Would you like to schedule a demo?`
    );

    if (confirmEnterprise) {
      // Track enterprise lead
      trackEvent('enterprise_lead_generated', {
        price: tier.price[billingCycle]
      });

      // Open calendly or email
      window.open('https://calendly.com/predictionnexus/enterprise-demo', '_blank');
      
      // Also send email notification
      window.location.href = 'mailto:support@predictionnexus.com?subject=Enterprise Tier Interest&body=I am interested in the Enterprise tier ($499) for my company.';
    }
  };

  return (
    <section className="py-24 relative overflow-hidden" id="pricing">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-emerald-950/10 to-black" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-full"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-red-400 font-semibold">LIMITED TIME - 67% OFF</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-bold mb-4"
          >
            Choose Your <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Growth Plan</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto mb-8"
          >
            Join 500+ SaaS companies optimizing their pricing with AI-powered insights
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 p-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full"
          >
            <button
              onClick={() => setBillingCycle('onetime')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                billingCycle === 'onetime' 
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              One-Time Purchase
            </button>
            <button
              onClick={() => setBillingCycle('subscription')}
              className={`px-6 py-2.5 rounded-full font-semibold transition-all ${
                billingCycle === 'subscription' 
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative ${tier.popular ? 'md:scale-105' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-0 right-0 text-center z-10">
                  <span className="inline-block px-6 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-bold rounded-full shadow-lg">
                    🔥 MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className={`relative h-full rounded-2xl backdrop-blur-sm transition-all duration-300 ${
                tier.popular 
                  ? 'bg-gradient-to-b from-gray-800/90 to-gray-900/90 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20' 
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}>
                {/* Glow effect for popular */}
                {tier.popular && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-xl -z-10" />
                )}

                <div className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2 text-white">{tier.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                    
                    <div className="mb-4">
                      <span className="text-gray-500 line-through text-xl">
                        ${tier.originalPrice[billingCycle]}
                      </span>
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-5xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                          ${tier.price[billingCycle]}
                        </span>
                        {billingCycle === 'subscription' && (
                          <span className="text-lg text-gray-400 mb-2">/mo</span>
                        )}
                      </div>
                      {tier.savings && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-green-600/20 to-emerald-600/20 text-emerald-400 text-xs font-bold rounded-full"
                        >
                          {tier.savings}
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {tier.features.map((feature, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * i }}
                        className="flex items-start gap-3"
                      >
                        <span className="text-emerald-400 mt-0.5 text-lg">{feature.substring(0, 2)}</span>
                        <span className="text-gray-300 text-sm">{feature.substring(2)}</span>
                      </motion.div>
                    ))}
                    {tier.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-start gap-3 opacity-50">
                        <span className="text-gray-500 mt-0.5">✗</span>
                        <span className="text-gray-500 text-sm line-through">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePurchase(tier)}
                    disabled={loadingTier === tier.value}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      tier.popular
                        ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg hover:shadow-xl'
                        : tier.enterprise
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    } ${loadingTier === tier.value ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loadingTier === tier.value ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span>{tier.buttonText} →</span>
                    )}
                  </button>

                  {!tier.enterprise && (
                    <p className="text-center text-xs text-gray-500 mt-4">
                      🔒 Secure checkout • 💸 30-day guarantee
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Value Props */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 grid md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { icon: '🚀', title: 'Instant Access', desc: 'Start optimizing immediately' },
            { icon: '🤖', title: 'AI Insights', desc: 'GPT-4 powered analysis' },
            { icon: '💰', title: 'ROI Guarantee', desc: '10x value or money back' },
            { icon: '🛡️', title: 'Secure & Private', desc: 'Your data never leaves' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{item.icon}</div>
              <h4 className="font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Hidden Stripe Buy Buttons (for fallback) */}
        <div className="hidden">
          <stripe-buy-button
            buy-button-id="buy_btn_1RqOC7I6kujeAM5FZbqTtxFL"
            publishable-key="pk_live_51PsyMBI6kujeAM5FZfLJiS8RxEV49oCnJEGYvh2X1TaKz1PsOjEBJzStQhEpdKPXOiaHx0pcwSXBOv5NBbSSgHdS00aQahHq1x"
          />
        </div>
      </div>
    </section>
  );
}