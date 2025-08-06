import { useState } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';

export default function TieredPricing() {
  const [billingCycle, setBillingCycle] = useState('onetime'); // 'onetime' or 'subscription'
  
  const tiers = [
    {
      name: 'Starter',
      price: { onetime: 99, subscription: 29 },
      originalPrice: { onetime: 299, subscription: 49 },
      description: 'Perfect for bootstrapped startups',
      features: [
        'Core Pricing Calculator',
        'Competitor Analysis',
        'SaaS Metrics Dashboard',
        'PDF Export & Reports',
        'Email Support',
        '30-Day Money Back Guarantee'
      ],
      limitations: [
        'Single User',
        'No API Access',
        'No Custom Branding'
      ],
      buttonText: 'Get Started',
      buttonId: 'buy_btn_1RqOC7I6kujeAM5FZbqTtxFL', // Current Stripe button
      popular: false
    },
    {
      name: 'Professional',
      price: { onetime: 199, subscription: 59 },
      originalPrice: { onetime: 599, subscription: 99 },
      description: 'For growing SaaS companies',
      features: [
        'Everything in Starter',
        '3 Industry Templates',
        'API Access',
        'Team Collaboration (3 seats)',
        'Custom Branding on Reports',
        'Priority Support',
        'Pricing Experiments Tracker',
        'Advanced Analytics'
      ],
      limitations: [],
      buttonText: 'Go Professional',
      buttonId: 'buy_btn_professional', // Need to create in Stripe
      popular: true,
      savings: 'Save $100'
    },
    {
      name: 'Enterprise',
      price: { onetime: 499, subscription: 149 },
      originalPrice: { onetime: 1999, subscription: 299 },
      description: 'For established businesses',
      features: [
        'Everything in Professional',
        'Unlimited Team Seats',
        'White-Label Options',
        'Custom Integrations',
        'Dedicated Account Manager',
        'Custom Training Session',
        'Quarterly Business Reviews',
        'SLA Guarantee'
      ],
      limitations: [],
      buttonText: 'Contact Sales',
      buttonId: 'buy_btn_enterprise', // Need to create in Stripe
      popular: false,
      enterprise: true
    }
  ];

  const handlePurchase = async (tier) => {
    if (tier.enterprise) {
      // Open calendly or email for enterprise
      window.location.href = 'mailto:support@predictionnexus.com?subject=Enterprise Pricing Inquiry';
      return;
    }

    // For now, use the existing Stripe button for all tiers
    // In production, each tier would have its own Stripe product
    const stripe = await loadStripe('pk_live_51PsyMBI6kujeAM5FZfLJiS8RxEV49oCnJEGYvh2X1TaKz1PsOjEBJzStQhEpdKPXOiaHx0pcwSXBOv5NBbSSgHdS00aQahHq1x');
    
    // This would be replaced with actual Stripe checkout session
    if (tier.name === 'Starter') {
      // Use existing buy button logic
      document.getElementById(tier.buttonId)?.click();
    } else {
      // For demo purposes, show coming soon
      alert(`${tier.name} tier coming soon! For now, get started with our Starter plan.`);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black" id="pricing">
      <div className="container">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-2 bg-red-600/20 rounded-full text-red-400 font-semibold"
          >
            LIMITED TIME OFFER - 67% OFF
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Choose Your <span className="gradient-text">Growth Plan</span>
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Professional pricing tools that pay for themselves with your first optimized customer
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-gray-800 rounded-full">
            <button
              onClick={() => setBillingCycle('onetime')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === 'onetime' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              One-Time Purchase
            </button>
            <button
              onClick={() => setBillingCycle('subscription')}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                billingCycle === 'subscription' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Subscription
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative ${tier.popular ? 'md:-mt-4' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 text-center">
                  <span className="inline-block px-4 py-1 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className={`premium-card p-8 h-full ${
                tier.popular 
                  ? 'border-2 border-primary shadow-2xl shadow-primary/20' 
                  : ''
              }`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-gray-500 line-through text-xl">
                      ${tier.originalPrice[billingCycle]}
                    </span>
                    <div className="text-5xl font-bold text-primary">
                      ${tier.price[billingCycle]}
                      {billingCycle === 'subscription' && (
                        <span className="text-lg text-gray-400">/mo</span>
                      )}
                    </div>
                    {tier.savings && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-600/20 text-green-400 text-xs font-semibold rounded">
                        {tier.savings}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                  {tier.limitations.map((limitation, i) => (
                    <div key={i} className="flex items-start gap-3 opacity-60">
                      <span className="text-gray-500 mt-1">✗</span>
                      <span className="text-gray-500 text-sm line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePurchase(tier)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'premium-button text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {tier.buttonText} →
                </button>

                {!tier.enterprise && (
                  <p className="text-center text-xs text-gray-500 mt-4">
                    30-day money-back guarantee
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-8 flex-wrap justify-center text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              <span>Stripe Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <span>Free Updates</span>
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">
            Questions? Check our <a href="/resources#faq" className="text-primary hover:underline">FAQ</a> or 
            email <a href="mailto:support@predictionnexus.com" className="text-primary hover:underline">support@predictionnexus.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}