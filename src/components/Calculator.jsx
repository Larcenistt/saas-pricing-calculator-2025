import { useState } from 'react';
import { exportToPDF } from '../utils/exportPDF';
import { exportToPDFEnhanced } from '../utils/exportPDFEnhanced';

export default function Calculator() {
  const [inputs, setInputs] = useState({
    currentPrice: '',
    competitorPrice: '',
    customers: '',
    churnRate: ''
  });

  const [results, setResults] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePricing = () => {
    // Simple calculations
    const current = parseFloat(inputs.currentPrice) || 0;
    const competitor = parseFloat(inputs.competitorPrice) || 0;
    const customers = parseInt(inputs.customers) || 0;
    const churn = parseFloat(inputs.churnRate) || 0;

    // Base recommendation: 10% above competitor or current price
    const recommendedBase = competitor > 0 ? competitor * 1.1 : current * 1.1;

    // Three-tier structure
    const tiers = {
      starter: {
        name: 'Starter',
        price: Math.round(recommendedBase * 0.5),
        features: [
          'Up to 10 users',
          'Basic features',
          'Email support',
          'Monthly billing'
        ]
      },
      professional: {
        name: 'Professional',
        price: Math.round(recommendedBase),
        features: [
          'Up to 50 users',
          'All features',
          'Priority support',
          'Advanced analytics'
        ],
        recommended: true
      },
      enterprise: {
        name: 'Enterprise',
        price: Math.round(recommendedBase * 2.5),
        features: [
          'Unlimited users',
          'Custom features',
          'Dedicated support',
          'Custom contracts'
        ]
      }
    };

    // Revenue projections
    const monthlyRevenue = customers * recommendedBase;
    const yearlyRevenue = monthlyRevenue * 12;
    const churnImpact = yearlyRevenue * (churn / 100);

    setResults({
      tiers,
      metrics: {
        recommendedPrice: Math.round(recommendedBase),
        monthlyRevenue: Math.round(monthlyRevenue),
        yearlyRevenue: Math.round(yearlyRevenue),
        churnImpact: Math.round(churnImpact),
        competitorComparison: competitor > 0 ? Math.round(((recommendedBase - competitor) / competitor) * 100) : 0
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6">SaaS Pricing Calculator</h2>
      
      {/* Input Form */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Current Price ($/month)
          </label>
          <input
            type="number"
            name="currentPrice"
            value={inputs.currentPrice}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="29"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Main Competitor Price ($/month)
          </label>
          <input
            type="number"
            name="competitorPrice"
            value={inputs.competitorPrice}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="39"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Customers
          </label>
          <input
            type="number"
            name="customers"
            value={inputs.customers}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Churn Rate (%)
          </label>
          <input
            type="number"
            name="churnRate"
            value={inputs.churnRate}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="5"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <div className="text-center mb-8">
        <button
          onClick={calculatePricing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Calculate Optimal Pricing
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Key Metrics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Recommended Price</p>
                <p className="text-2xl font-bold text-green-600">${results.metrics.recommendedPrice}/mo</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Projected Monthly Revenue</p>
                <p className="text-2xl font-bold">${results.metrics.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Projected Annual Revenue</p>
                <p className="text-2xl font-bold">${results.metrics.yearlyRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">vs. Competitor</p>
                <p className="text-2xl font-bold">
                  {results.metrics.competitorComparison > 0 ? '+' : ''}
                  {results.metrics.competitorComparison}%
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Recommended Pricing Tiers</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.values(results.tiers).map((tier) => (
                <div
                  key={tier.name}
                  className={`border rounded-lg p-6 ${
                    tier.recommended ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                  }`}
                >
                  {tier.recommended && (
                    <div className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded inline-block mb-2">
                      MOST POPULAR
                    </div>
                  )}
                  <h4 className="font-bold text-xl mb-2">{tier.name}</h4>
                  <p className="text-3xl font-bold mb-4">
                    ${tier.price}
                    <span className="text-sm font-normal text-gray-600">/mo</span>
                  </p>
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={() => exportToPDF(results)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Export Simple PDF
            </button>
            <button
              onClick={() => exportToPDFEnhanced(results)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Export Professional PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}