export default function handler(req, res) {
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

  const { users, features, growthRate, contractLength, supportTier } = req.body;

  // Basic pricing calculation logic
  const basePrice = 99;
  const pricePerUser = 10;
  const featureMultiplier = 1 + (features * 0.1);
  const growthMultiplier = 1 + (growthRate * 0.01);
  const contractDiscount = contractLength === 'annual' ? 0.8 : 1;
  const supportMultiplier = supportTier === 'premium' ? 1.5 : supportTier === 'enterprise' ? 2 : 1;

  const monthlyPrice = Math.round(
    basePrice + 
    (users * pricePerUser * featureMultiplier * growthMultiplier * supportMultiplier * contractDiscount)
  );

  const annualPrice = monthlyPrice * 12;
  const savings = contractLength === 'annual' ? Math.round(annualPrice * 0.2) : 0;

  res.status(200).json({
    success: true,
    data: {
      monthlyPrice,
      annualPrice,
      savings,
      pricePerUser: Math.round(monthlyPrice / users),
      features: {
        users,
        featuresCount: features,
        growthRate,
        contractLength,
        supportTier
      },
      breakdown: {
        base: basePrice,
        userCost: users * pricePerUser,
        featuresCost: Math.round((featureMultiplier - 1) * 100),
        growthCost: Math.round((growthMultiplier - 1) * 100),
        supportCost: Math.round((supportMultiplier - 1) * 100),
        discount: savings
      },
      timestamp: new Date().toISOString()
    }
  });
}