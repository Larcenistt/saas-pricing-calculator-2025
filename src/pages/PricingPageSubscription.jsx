import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useSubscriptionStore from '../stores/subscriptionStore';
import toast from 'react-hot-toast';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';

const plans = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out our calculator',
    features: [
      '5 calculations per month',
      'Basic analytics',
      'PDF export',
      'Email support'
    ],
    limitations: [
      'No API access',
      'No team collaboration',
      'Limited history'
    ],
    cta: 'Current Plan',
    popular: false
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 79,
    description: 'Everything you need to optimize pricing',
    features: [
      'Unlimited calculations',
      'Advanced analytics & insights',
      'Priority support',
      'API access (1000 calls/month)',
      'Custom branding',
      'Team collaboration (up to 5 users)',
      'Export to Excel/CSV',
      'Historical data & trends',
      '30-day calculation history'
    ],
    limitations: [],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 299,
    description: 'For teams that need maximum power',
    features: [
      'Everything in Professional',
      'Unlimited API calls',
      'White-label options',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9% uptime)',
      'Unlimited team members',
      'Advanced security features',
      'Custom reporting',
      'Phone support'
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingPageSubscription() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { 
    subscription, 
    plan: currentPlan, 
    fetchSubscription, 
    createCheckout,
    cancelSubscription,
    resumeSubscription,
    isLoading 
  } = useSubscriptionStore();
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    }
  }, [isAuthenticated]);

  const handleSelectPlan = async (planId) => {
    if (!isAuthenticated) {
      navigate('/register', { state: { redirectTo: '/pricing', selectedPlan: planId } });
      return;
    }

    if (planId === 'FREE') {
      if (currentPlan !== 'FREE') {
        // Downgrade to free - cancel subscription
        if (window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features.')) {
          await cancelSubscription();
        }
      }
      return;
    }

    if (planId === 'ENTERPRISE') {
      // Open contact form or redirect to sales
      window.open('mailto:support@predictionnexus.com?subject=Enterprise Plan Inquiry', '_blank');
      return;
    }

    // Create Stripe checkout for Professional plan
    await createCheckout(
      planId,
      `${window.location.origin}/success?plan=${planId}`,
      `${window.location.origin}/pricing`
    );
  };

  const getButtonText = (planId) => {
    if (!isAuthenticated) {
      return planId === 'ENTERPRISE' ? 'Contact Sales' : 'Get Started';
    }

    if (currentPlan === planId) {
      if (subscription?.status === 'CANCELLING') {
        return 'Resuming...';
      }
      return 'Current Plan';
    }

    if (currentPlan === 'ENTERPRISE' && planId !== 'ENTERPRISE') {
      return 'Downgrade';
    }

    if (currentPlan === 'PROFESSIONAL' && planId === 'FREE') {
      return 'Downgrade';
    }

    return plans.find(p => p.id === planId)?.cta || 'Select';
  };

  const isButtonDisabled = (planId) => {
    return isLoading || (currentPlan === planId && subscription?.status === 'ACTIVE');
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Choose Your Plan
            </span>
          </h1>
          <p className="text-xl text-muted max-w-3xl mx-auto">
            Start with our free plan or unlock powerful features with our premium subscriptions
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-glass-primary rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-white'
              }`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Current Subscription Status */}
        {isAuthenticated && subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Current Plan</h3>
                  <p className="text-muted">
                    You are on the <span className="text-primary font-bold">{currentPlan}</span> plan
                    {subscription.status === 'CANCELLING' && (
                      <span className="text-warning ml-2">
                        (Cancelling at end of period)
                      </span>
                    )}
                  </p>
                  {subscription.currentPeriodEnd && (
                    <p className="text-sm text-muted mt-1">
                      Next billing date: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {subscription.status === 'CANCELLING' && (
                  <Button
                    onClick={resumeSubscription}
                    variant="secondary"
                    disabled={isLoading}
                  >
                    Resume Subscription
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <GlassCard 
                className={`p-8 h-full flex flex-col ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${currentPlan === plan.id ? 'bg-primary/5' : ''}`}
              >
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">
                      ${billingCycle === 'yearly' 
                        ? Math.round(plan.price * 0.8) 
                        : plan.price}
                    </span>
                    <span className="text-muted ml-2">
                      /{billingCycle === 'yearly' ? 'month (billed yearly)' : 'month'}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-grow">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg 
                          className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.limitations.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start">
                          <svg 
                            className="w-5 h-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M6 18L18 6M6 6l12 12" 
                            />
                          </svg>
                          <span className="text-sm text-muted">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.popular ? 'primary' : 'secondary'}
                  size="lg"
                  className="w-full"
                  disabled={isButtonDisabled(plan.id)}
                >
                  {getButtonText(plan.id)}
                </Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted">
                Yes, we offer a 14-day free trial for our Professional plan. No credit card required.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-semibold mb-2">Can I cancel my subscription?</h3>
              <p className="text-muted">
                Yes, you can cancel anytime. You'll retain access until the end of your billing period.
              </p>
            </GlassCard>
          </div>
        </motion.div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <GlassCard className="p-8 max-w-2xl mx-auto">
            <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 className="text-2xl font-bold mb-2">30-Day Money Back Guarantee</h3>
            <p className="text-muted">
              Try our Professional or Enterprise plans risk-free. If you're not completely satisfied within the first 30 days, we'll give you a full refund - no questions asked.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}