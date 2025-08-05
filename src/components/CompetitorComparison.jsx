import { useState } from 'react';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import toast from 'react-hot-toast';
import { trackCalculatorUse } from '../utils/analytics';

export default function CompetitorComparison() {
  const [company, setCompany] = useState({
    name: 'Your Company',
    price: '',
    features: '',
    targetMarket: 'SMB'
  });

  const [competitors, setCompetitors] = useState([
    { id: 1, name: '', price: '', features: '', targetMarket: 'SMB' }
  ]);

  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Pre-filled competitor templates
  const competitorTemplates = {
    'CRM': [
      { name: 'Salesforce', price: '150', features: '20', targetMarket: 'Enterprise' },
      { name: 'HubSpot', price: '45', features: '15', targetMarket: 'SMB' },
      { name: 'Pipedrive', price: '29', features: '12', targetMarket: 'SMB' }
    ],
    'Project Management': [
      { name: 'Asana', price: '24.99', features: '18', targetMarket: 'SMB' },
      { name: 'Monday.com', price: '36', features: '20', targetMarket: 'SMB' },
      { name: 'ClickUp', price: '19', features: '25', targetMarket: 'Startup' }
    ],
    'Email Marketing': [
      { name: 'Mailchimp', price: '39', features: '15', targetMarket: 'SMB' },
      { name: 'ConvertKit', price: '59', features: '12', targetMarket: 'Creator' },
      { name: 'ActiveCampaign', price: '49', features: '20', targetMarket: 'SMB' }
    ],
    'Analytics': [
      { name: 'Mixpanel', price: '89', features: '22', targetMarket: 'SMB' },
      { name: 'Amplitude', price: '99', features: '25', targetMarket: 'Enterprise' },
      { name: 'Heap', price: '79', features: '20', targetMarket: 'SMB' }
    ]
  };

  const addCompetitor = () => {
    setCompetitors([...competitors, { 
      id: Date.now(), 
      name: '', 
      price: '', 
      features: '', 
      targetMarket: 'SMB' 
    }]);
  };

  const removeCompetitor = (id) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const updateCompetitor = (id, field, value) => {
    setCompetitors(competitors.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const loadTemplate = (category) => {
    const template = competitorTemplates[category];
    if (template) {
      setCompetitors(template.map((t, index) => ({ ...t, id: index + 1 })));
      toast.success(`Loaded ${category} competitors`);
    }
  };

  const analyzeComparison = () => {
    // Validate inputs
    if (!company.price || competitors.every(c => !c.price)) {
      toast.error('Please enter pricing information');
      return;
    }

    setIsAnalyzing(true);

    // Simulate analysis
    setTimeout(() => {
      const yourPrice = parseFloat(company.price) || 0;
      const competitorPrices = competitors
        .filter(c => c.price)
        .map(c => parseFloat(c.price));
      
      const avgCompetitorPrice = competitorPrices.length > 0
        ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
        : 0;

      const priceDifference = ((yourPrice - avgCompetitorPrice) / avgCompetitorPrice) * 100;
      
      // Feature comparison
      const yourFeatures = parseInt(company.features) || 0;
      const avgFeatures = competitors
        .filter(c => c.features)
        .map(c => parseInt(c.features))
        .reduce((a, b, _, arr) => a + b / arr.length, 0);

      const featureValueRatio = yourFeatures > 0 ? yourPrice / yourFeatures : 0;
      const competitorValueRatio = avgFeatures > 0 ? avgCompetitorPrice / avgFeatures : 0;

      // Market positioning
      const marketPositions = {
        'Startup': 0.7,
        'SMB': 1.0,
        'Enterprise': 1.5,
        'Creator': 0.8
      };

      const yourMarketMultiplier = marketPositions[company.targetMarket] || 1;
      const suggestedPrice = avgCompetitorPrice * yourMarketMultiplier * (yourFeatures / avgFeatures || 1);

      const results = {
        yourPrice,
        avgCompetitorPrice,
        priceDifference,
        pricePosition: priceDifference < -20 ? 'underpriced' : priceDifference > 20 ? 'overpriced' : 'competitive',
        suggestedPrice: Math.round(suggestedPrice),
        potentialRevenue: suggestedPrice > yourPrice ? (suggestedPrice - yourPrice) * 100 : 0,
        featureComparison: {
          yours: yourFeatures,
          average: Math.round(avgFeatures),
          valueRatio: featureValueRatio.toFixed(2),
          competitorValueRatio: competitorValueRatio.toFixed(2)
        },
        recommendations: generateRecommendations(priceDifference, featureValueRatio, competitorValueRatio),
        competitorBreakdown: competitors.filter(c => c.price).map(c => ({
          name: c.name || 'Competitor',
          price: parseFloat(c.price),
          features: parseInt(c.features) || 0,
          pricePerFeature: c.features ? (parseFloat(c.price) / parseInt(c.features)).toFixed(2) : 'N/A'
        }))
      };

      setAnalysis(results);
      setIsAnalyzing(false);
      
      trackCalculatorUse({ 
        tool: 'competitor_comparison',
        competitors: competitors.length,
        suggestedPrice: results.suggestedPrice 
      });
    }, 1500);
  };

  const generateRecommendations = (priceDiff, yourValue, compValue) => {
    const recommendations = [];

    if (priceDiff < -20) {
      recommendations.push({
        type: 'warning',
        title: 'Significantly Underpriced',
        message: 'You\'re pricing 20%+ below market average. Consider raising prices to capture more value.',
        action: 'Test a 15-20% price increase with new customers'
      });
    }

    if (yourValue > compValue * 1.2) {
      recommendations.push({
        type: 'info',
        title: 'Poor Value Perception',
        message: 'Your price-per-feature ratio is high. Customers might perceive less value.',
        action: 'Highlight unique features or add more capabilities'
      });
    }

    if (priceDiff > -10 && priceDiff < 10) {
      recommendations.push({
        type: 'success',
        title: 'Competitive Pricing',
        message: 'Your pricing is within market range. Focus on differentiation.',
        action: 'Emphasize unique value propositions in marketing'
      });
    }

    return recommendations;
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Competitor Pricing Analysis</h2>
        <p className="text-secondary/80 max-w-2xl mx-auto">
          Compare your pricing with competitors to find your optimal market position
        </p>
      </div>

      {/* Quick Templates */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <p className="text-sm text-secondary/60 w-full text-center mb-2">Quick load competitors:</p>
        {Object.keys(competitorTemplates).map(category => (
          <Button
            key={category}
            size="sm"
            variant="secondary"
            onClick={() => loadTemplate(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Your Company */}
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-primary">Your Company</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="input w-full"
                placeholder="Your Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Monthly Price ($)</label>
              <input
                type="number"
                value={company.price}
                onChange={(e) => setCompany({ ...company, price: e.target.value })}
                className="input w-full"
                placeholder="49"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Features</label>
              <input
                type="number"
                value={company.features}
                onChange={(e) => setCompany({ ...company, features: e.target.value })}
                className="input w-full"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Target Market</label>
              <select
                value={company.targetMarket}
                onChange={(e) => setCompany({ ...company, targetMarket: e.target.value })}
                className="input w-full"
              >
                <option value="Startup">Startup</option>
                <option value="SMB">SMB</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Creator">Creator</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Competitors */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Competitors</h3>
            <Button size="sm" variant="secondary" onClick={addCompetitor}>
              + Add Competitor
            </Button>
          </div>

          {competitors.map((competitor, index) => (
            <GlassCard key={competitor.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-secondary/60">Competitor {index + 1}</h4>
                {competitors.length > 1 && (
                  <button
                    onClick={() => removeCompetitor(competitor.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={competitor.name}
                  onChange={(e) => updateCompetitor(competitor.id, 'name', e.target.value)}
                  className="input input-sm"
                  placeholder="Name"
                />
                <input
                  type="number"
                  value={competitor.price}
                  onChange={(e) => updateCompetitor(competitor.id, 'price', e.target.value)}
                  className="input input-sm"
                  placeholder="Price ($)"
                />
                <input
                  type="number"
                  value={competitor.features}
                  onChange={(e) => updateCompetitor(competitor.id, 'features', e.target.value)}
                  className="input input-sm"
                  placeholder="Features"
                />
                <select
                  value={competitor.targetMarket}
                  onChange={(e) => updateCompetitor(competitor.id, 'targetMarket', e.target.value)}
                  className="input input-sm"
                >
                  <option value="Startup">Startup</option>
                  <option value="SMB">SMB</option>
                  <option value="Enterprise">Enterprise</option>
                  <option value="Creator">Creator</option>
                </select>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center">
        <Button
          onClick={analyzeComparison}
          variant="primary"
          size="lg"
          disabled={isAnalyzing}
          className="min-w-[200px]"
        >
          {isAnalyzing ? 'Analyzing...' : 'Compare Pricing'}
        </Button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-secondary/60 mb-2">Your Price</p>
              <p className="text-3xl font-bold">${analysis.yourPrice}</p>
              <p className={`text-sm mt-2 ${
                analysis.pricePosition === 'underpriced' ? 'text-red-400' :
                analysis.pricePosition === 'overpriced' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {analysis.pricePosition === 'underpriced' ? '⚠️ Underpriced' :
                 analysis.pricePosition === 'overpriced' ? '⚠️ Overpriced' :
                 '✓ Competitive'}
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <p className="text-sm text-secondary/60 mb-2">Market Average</p>
              <p className="text-3xl font-bold">${analysis.avgCompetitorPrice.toFixed(2)}</p>
              <p className="text-sm mt-2 text-secondary/60">
                {analysis.priceDifference > 0 ? '+' : ''}{analysis.priceDifference.toFixed(1)}% difference
              </p>
            </GlassCard>

            <GlassCard className="p-6 text-center border-primary/30">
              <p className="text-sm text-secondary/60 mb-2">Suggested Price</p>
              <p className="text-3xl font-bold text-primary">${analysis.suggestedPrice}</p>
              <p className="text-sm mt-2 text-green-400">
                +${analysis.potentialRevenue.toFixed(0)}/mo potential
              </p>
            </GlassCard>
          </div>

          {/* Competitor Breakdown */}
          <GlassCard className="p-6">
            <h3 className="text-xl font-semibold mb-4">Competitor Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-glass-border">
                    <th className="text-left py-2 px-4">Company</th>
                    <th className="text-right py-2 px-4">Price</th>
                    <th className="text-right py-2 px-4">Features</th>
                    <th className="text-right py-2 px-4">$/Feature</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-glass-border">
                    <td className="py-2 px-4 font-medium">{company.name} (You)</td>
                    <td className="text-right py-2 px-4">${analysis.yourPrice}</td>
                    <td className="text-right py-2 px-4">{analysis.featureComparison.yours}</td>
                    <td className="text-right py-2 px-4">${analysis.featureComparison.valueRatio}</td>
                  </tr>
                  {analysis.competitorBreakdown.map((comp, index) => (
                    <tr key={index} className="border-b border-glass-border">
                      <td className="py-2 px-4">{comp.name}</td>
                      <td className="text-right py-2 px-4">${comp.price}</td>
                      <td className="text-right py-2 px-4">{comp.features}</td>
                      <td className="text-right py-2 px-4">${comp.pricePerFeature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Recommendations */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Recommendations</h3>
            {analysis.recommendations.map((rec, index) => (
              <GlassCard key={index} className={`p-6 border-l-4 ${
                rec.type === 'warning' ? 'border-yellow-500' :
                rec.type === 'success' ? 'border-green-500' :
                'border-blue-500'
              }`}>
                <h4 className="font-semibold mb-2">{rec.title}</h4>
                <p className="text-secondary/80 mb-3">{rec.message}</p>
                <p className="text-sm font-medium">
                  <span className="text-primary">Action:</span> {rec.action}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}