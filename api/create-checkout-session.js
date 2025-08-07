import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Tier pricing configuration
const TIER_PRICES = {
  starter: {
    onetime: 'price_1QStripeStarterOnetimeID', // Replace with actual Stripe price ID
    subscription: 'price_1QStripeStarterMonthlyID',
    amount: 99
  },
  professional: {
    onetime: 'price_1QStripeProfessionalOnetimeID', // Replace with actual Stripe price ID
    subscription: 'price_1QStripeProfessionalMonthlyID',
    amount: 199
  },
  enterprise: {
    onetime: 'price_1QStripeEnterpriseOnetimeID', // Replace with actual Stripe price ID
    subscription: 'price_1QStripeEnterpriseMonthlyID',
    amount: 499
  }
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tierName, billingCycle = 'onetime', priceId } = req.body;

    if (!tierName) {
      return res.status(400).json({ error: 'Tier name is required' });
    }

    const tierKey = tierName.toLowerCase();
    const tierConfig = TIER_PRICES[tierKey];

    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SaaS Pricing Calculator - ${tierName}`,
              description: getDescription(tierKey),
              images: ['https://saas-pricing-calculator-2025.vercel.app/logo.png'],
            },
            unit_amount: tierConfig.amount * 100, // Stripe expects cents
            ...(billingCycle === 'subscription' && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: billingCycle === 'subscription' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://saas-pricing-calculator-2025.vercel.app'}/success?tier=${tierKey}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://saas-pricing-calculator-2025.vercel.app'}/pricing`,
      metadata: {
        tier: tierKey,
        billingCycle,
      },
      // Enable promotional codes
      allow_promotion_codes: true,
      // Collect billing address for tax purposes
      billing_address_collection: 'required',
      // Customer email collection
      customer_email: req.body.email || undefined,
    });

    // Log the checkout creation for analytics
    console.log(`Checkout session created for ${tierName} tier:`, session.id);

    res.status(200).json({ 
      id: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
}

function getDescription(tier) {
  const descriptions = {
    starter: 'Perfect for bootstrapped startups. Includes core calculator, basic metrics, and PDF exports.',
    professional: 'For growing SaaS companies. Includes AI insights, advanced analytics, team collaboration, and Excel exports.',
    enterprise: 'For established businesses. Includes everything plus unlimited seats, white-label options, API access, and dedicated support.'
  };
  
  return descriptions[tier] || 'Premium SaaS pricing calculator';
}