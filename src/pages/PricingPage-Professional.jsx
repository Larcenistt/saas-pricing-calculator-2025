import BuyButtonWrapper from '../components/BuyButtonWrapper';

export default function PricingPage() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      description: 'For early-stage startups',
      features: [
        'Basic pricing calculator',
        'Competitor analysis',
        'PDF export',
        'Email support'
      ],
      available: false
    },
    {
      name: 'Professional',
      price: 99,
      description: 'Everything you need to optimize pricing',
      features: [
        'Advanced AI-powered calculator',
        'Full competitor analysis',
        'All export formats',
        '20+ SaaS metrics',
        'Industry benchmarks',
        'Priority support',
        'Lifetime updates'
      ],
      recommended: true,
      available: true
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
        'Team collaboration',
        'Dedicated support',
        'Custom integrations'
      ],
      available: false
    }
  ];

  return (
    <div className="py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-secondary max-w-2xl mx-auto">
            One-time payment. No subscriptions. No hidden fees. 
            Get lifetime access to professional pricing optimization tools.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`pricing-card ${plan.recommended ? 'featured' : ''}`}
            >
              {plan.recommended && (
                <div className="badge badge-primary mb-4">
                  MOST POPULAR
                </div>
              )}
              
              <h3 className="mb-2">{plan.name}</h3>
              <p className="text-secondary text-sm mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted ml-2">one-time</span>
              </div>
              
              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
              
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
                  Coming Soon
                </button>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-8 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure payment via Stripe</span>
            </div>
          </div>
          
          <p className="text-sm text-muted mt-8">
            Questions? Email us at support@priceoptimizerpro.com
          </p>
        </motion.div>
      </div>
    </div>
  );
}