import { useState } from 'react';
import BuyButtonWrapper from '../components/BuyButtonWrapper';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('lifetime');

  const plans = [
    {
      name: 'Starter',
      price: 49,
      description: 'Perfect for early-stage startups',
      features: [
        'Basic pricing calculator',
        'Up to 1,000 customers',
        'Competitor analysis',
        'PDF export',
        'Email support'
      ],
      limitations: [
        'Limited to 3 pricing tiers',
        'Basic metrics only'
      ],
      available: false,
      badge: null
    },
    {
      name: 'Professional',
      price: 99,
      originalPrice: 197,
      description: 'Everything you need to optimize pricing',
      features: [
        'Advanced AI-powered calculator',
        'Unlimited customers',
        'Full competitor analysis',
        'All export formats',
        '20+ SaaS metrics',
        'Industry benchmarks',
        'Priority support',
        'Lifetime updates'
      ],
      limitations: [],
      recommended: true,
      available: true,
      badge: 'MOST POPULAR'
    },
    {
      name: 'Enterprise',
      price: 299,
      description: 'For teams and advanced needs',
      features: [
        'Everything in Professional',
        'API access',
        'White-label exports',
        'Custom branding',
        'Team collaboration (5 seats)',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee'
      ],
      limitations: [],
      available: false,
      badge: 'COMING SOON'
    }
  ];

  return (
    <div className="pt-24 pb-24">
      <div className="container">
        <div className="text-center mb-16">
          <h1 className="mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="lead max-w-2xl mx-auto mb-8">
            One-time payment. No subscriptions. No hidden fees. 
            Get lifetime access to professional pricing optimization tools.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-glass-primary rounded-lg">
            <button
              onClick={() => setBillingPeriod('lifetime')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'lifetime' 
                  ? 'bg-primary text-white' 
                  : 'text-secondary hover:text-white'
              }`}
            >
              Lifetime Deal
            </button>
            <button
              onClick={() => setBillingPeriod('subscription')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === 'subscription' 
                  ? 'bg-primary text-white' 
                  : 'text-secondary hover:text-white'
              }`}
              disabled
            >
              Monthly
              <span className="ml-2 text-xs opacity-60">(Coming soon)</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative ${plan.recommended ? 'featured' : ''}`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 badge ${
                  plan.recommended ? 'badge-primary' : 'badge-secondary'
                }`}>
                  {plan.badge}
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-secondary text-sm">{plan.description}</p>
              </div>
              
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold">${plan.price}</span>
                  {plan.originalPrice && (
                    <span className="text-xl text-muted line-through">${plan.originalPrice}</span>
                  )}
                </div>
                <p className="text-muted text-sm mt-2">one-time payment</p>
                {plan.originalPrice && (
                  <p className="text-accent text-sm mt-1">Save ${plan.originalPrice - plan.price}</p>
                )}
              </div>
              
              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary">{feature}</span>
                  </div>
                ))}
                {plan.limitations.map((limitation, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <svg className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-muted">{limitation}</span>
                  </div>
                ))}
              </div>
              
              {plan.available ? (
                plan.recommended ? (
                  <BuyButtonWrapper />
                ) : (
                  <button className="btn btn-secondary w-full">
                    Get Started
                  </button>
                )
              ) : (
                <button className="btn btn-secondary w-full opacity-50 cursor-not-allowed" disabled>
                  {plan.badge === 'COMING SOON' ? 'Coming Soon' : 'Not Available'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Trust Section */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: '30-Day Guarantee',
                description: '100% money back'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Secure Payment',
                description: 'Via Stripe'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Instant Access',
                description: 'Start immediately'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                title: 'Lifetime Updates',
                description: 'Forever free'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-glass-primary flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                <h4 className="font-semibold mb-1">{item.title}</h4>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted mt-12">
            Questions? Email us at support@predictionnexus.com
          </p>
        </div>
      </div>
    </div>
  );
}