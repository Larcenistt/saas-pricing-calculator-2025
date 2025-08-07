import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';

export default function CompetitorComparisonPremium() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const categories = [
    { id: 'all', name: 'All Features', icon: '🎯' },
    { id: 'pricing', name: 'Pricing & Value', icon: '💰' },
    { id: 'features', name: 'Core Features', icon: '⚡' },
    { id: 'analytics', name: 'Analytics & AI', icon: '🤖' },
    { id: 'support', name: 'Support & Updates', icon: '🛟' }
  ];

  const competitors = {
    us: {
      name: 'SaaS Calculator 2025',
      logo: '🚀',
      price: '$99',
      priceType: 'One-time',
      highlight: true
    },
    priceintelligently: {
      name: 'Price Intelligently',
      logo: '📊',
      price: '$2,999+',
      priceType: 'Monthly'
    },
    profitwell: {
      name: 'ProfitWell',
      logo: '📈',
      price: 'Custom',
      priceType: 'Contact Sales'
    },
    chargebee: {
      name: 'Chargebee',
      logo: '💳',
      price: '$599+',
      priceType: 'Monthly'
    },
    spreadsheet: {
      name: 'DIY Spreadsheet',
      logo: '📑',
      price: 'Free',
      priceType: 'Time cost'
    }
  };

  const features = [
    // Pricing & Value
    {
      category: 'pricing',
      name: 'Affordable Pricing',
      description: 'Get started without breaking the bank',
      us: { has: true, detail: '$99 lifetime' },
      priceintelligently: { has: false, detail: '$35,988/year minimum' },
      profitwell: { has: false, detail: 'Enterprise pricing' },
      chargebee: { has: false, detail: '$7,188/year minimum' },
      spreadsheet: { has: true, detail: 'Free but limited' }
    },
    {
      category: 'pricing',
      name: 'No Recurring Fees',
      description: 'Pay once, use forever',
      us: { has: true, detail: 'Lifetime access' },
      priceintelligently: { has: false, detail: 'Monthly subscription' },
      profitwell: { has: false, detail: 'Annual contracts' },
      chargebee: { has: false, detail: 'Monthly billing' },
      spreadsheet: { has: true, detail: 'No fees' }
    },
    {
      category: 'pricing',
      name: 'Instant ROI',
      description: 'See returns immediately',
      us: { has: true, detail: 'Average 47x ROI' },
      priceintelligently: { has: 'partial', detail: '3-6 month implementation' },
      profitwell: { has: 'partial', detail: 'Requires integration' },
      chargebee: { has: 'partial', detail: 'Setup required' },
      spreadsheet: { has: false, detail: 'Manual work' }
    },
    
    // Core Features
    {
      category: 'features',
      name: 'AI-Powered Insights',
      description: 'Get intelligent pricing recommendations',
      us: { has: true, detail: 'GPT-4 powered analysis' },
      priceintelligently: { has: true, detail: 'Proprietary AI' },
      profitwell: { has: 'partial', detail: 'Basic analytics' },
      chargebee: { has: false, detail: 'Rule-based only' },
      spreadsheet: { has: false, detail: 'Manual analysis' }
    },
    {
      category: 'features',
      name: 'Competitor Analysis',
      description: 'Compare against market leaders',
      us: { has: true, detail: '10,000+ companies' },
      priceintelligently: { has: true, detail: 'Custom research' },
      profitwell: { has: 'partial', detail: 'Limited data' },
      chargebee: { has: false, detail: 'Not included' },
      spreadsheet: { has: false, detail: 'Manual research' }
    },
    {
      category: 'features',
      name: 'Pricing Models',
      description: 'Multiple pricing strategies',
      us: { has: true, detail: '15+ models included' },
      priceintelligently: { has: true, detail: 'Custom models' },
      profitwell: { has: true, detail: 'Standard models' },
      chargebee: { has: 'partial', detail: 'Basic tiers' },
      spreadsheet: { has: 'partial', detail: 'DIY formulas' }
    },
    {
      category: 'features',
      name: 'Real-time Calculations',
      description: 'Instant results as you type',
      us: { has: true, detail: 'Zero latency' },
      priceintelligently: { has: false, detail: 'Report generation' },
      profitwell: { has: false, detail: 'Daily updates' },
      chargebee: { has: 'partial', detail: 'API delays' },
      spreadsheet: { has: true, detail: 'Excel formulas' }
    },
    
    // Analytics & AI
    {
      category: 'analytics',
      name: 'Market Positioning',
      description: 'Find your optimal market position',
      us: { has: true, detail: 'AI-driven positioning' },
      priceintelligently: { has: true, detail: 'Consultant-led' },
      profitwell: { has: 'partial', detail: 'Basic metrics' },
      chargebee: { has: false, detail: 'Not available' },
      spreadsheet: { has: false, detail: 'Manual guess' }
    },
    {
      category: 'analytics',
      name: 'Churn Prediction',
      description: 'Predict and prevent customer churn',
      us: { has: true, detail: 'ML-based prediction' },
      priceintelligently: { has: true, detail: 'Advanced analytics' },
      profitwell: { has: true, detail: 'Churn insights' },
      chargebee: { has: 'partial', detail: 'Basic reporting' },
      spreadsheet: { has: false, detail: 'No prediction' }
    },
    {
      category: 'analytics',
      name: 'LTV Optimization',
      description: 'Maximize customer lifetime value',
      us: { has: true, detail: 'Automated optimization' },
      priceintelligently: { has: true, detail: 'Strategic consulting' },
      profitwell: { has: true, detail: 'LTV tracking' },
      chargebee: { has: 'partial', detail: 'Basic LTV' },
      spreadsheet: { has: 'partial', detail: 'Manual calculation' }
    },
    {
      category: 'analytics',
      name: 'A/B Testing Tools',
      description: 'Test pricing strategies',
      us: { has: true, detail: 'Built-in simulator' },
      priceintelligently: { has: true, detail: 'Full service' },
      profitwell: { has: 'partial', detail: 'Basic testing' },
      chargebee: { has: false, detail: 'Not included' },
      spreadsheet: { has: false, detail: 'No testing' }
    },
    
    // Support & Updates
    {
      category: 'support',
      name: 'Setup Time',
      description: 'Time to get started',
      us: { has: true, detail: '5 minutes' },
      priceintelligently: { has: false, detail: '2-3 months' },
      profitwell: { has: false, detail: '2-4 weeks' },
      chargebee: { has: false, detail: '1-2 weeks' },
      spreadsheet: { has: 'partial', detail: 'Hours of work' }
    },
    {
      category: 'support',
      name: 'Expert Support',
      description: 'Get help when you need it',
      us: { has: true, detail: 'Email & chat support' },
      priceintelligently: { has: true, detail: 'Dedicated consultant' },
      profitwell: { has: true, detail: 'Customer success' },
      chargebee: { has: 'partial', detail: 'Ticket system' },
      spreadsheet: { has: false, detail: 'DIY only' }
    },
    {
      category: 'support',
      name: 'Regular Updates',
      description: 'Stay current with market trends',
      us: { has: true, detail: 'Weekly updates' },
      priceintelligently: { has: true, detail: 'Quarterly reports' },
      profitwell: { has: true, detail: 'Product updates' },
      chargebee: { has: true, detail: 'Platform updates' },
      spreadsheet: { has: false, detail: 'Manual updates' }
    },
    {
      category: 'support',
      name: 'Export Options',
      description: 'Share and present your data',
      us: { has: true, detail: 'PDF, Excel, CSV' },
      priceintelligently: { has: true, detail: 'Custom reports' },
      profitwell: { has: true, detail: 'Data export' },
      chargebee: { has: true, detail: 'API access' },
      spreadsheet: { has: 'partial', detail: 'Copy/paste' }
    }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const getStatusIcon = (status) => {
    if (status === true) return '✅';
    if (status === 'partial') return '⚠️';
    return '❌';
  };

  const getStatusColor = (status) => {
    if (status === true) return 'text-emerald-400';
    if (status === 'partial') return 'text-yellow-400';
    return 'text-red-400';
  };

  useEffect(() => {
    trackEvent('comparison_table_viewed', {
      category: selectedCategory
    });
  }, [selectedCategory]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h2 
          className="text-4xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Why We're the <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Clear Choice</span>
        </motion.h2>
        <p className="text-gray-300 text-lg">
          See how we stack up against the competition
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </motion.button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-4 px-4 text-gray-400 font-medium">Features</th>
              {Object.entries(competitors).map(([key, comp]) => (
                <th key={key} className="text-center py-4 px-4 min-w-[140px]">
                  <div className={`${comp.highlight ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-xl p-3' : ''}`}>
                    <div className="text-2xl mb-1">{comp.logo}</div>
                    <div className={`font-semibold ${comp.highlight ? 'text-white' : 'text-gray-300'}`}>
                      {comp.name}
                    </div>
                    <div className={`text-sm mt-1 ${comp.highlight ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {comp.price}
                    </div>
                    <div className="text-xs text-gray-500">{comp.priceType}</div>
                    {comp.highlight && (
                      <div className="mt-2">
                        <span className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          BEST VALUE
                        </span>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map((feature, index) => (
                <motion.tr
                  key={feature.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
                  onMouseEnter={() => setHoveredFeature(feature.name)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <td className="py-4 px-4">
                    <div>
                      <div className="text-white font-medium">{feature.name}</div>
                      {hoveredFeature === feature.name && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-gray-400 mt-1"
                        >
                          {feature.description}
                        </motion.div>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <div className={competitors.us.highlight ? 'bg-emerald-500/10 rounded-lg p-2' : ''}>
                      <span className={`text-xl ${getStatusColor(feature.us.has)}`}>
                        {getStatusIcon(feature.us.has)}
                      </span>
                      {hoveredFeature === feature.name && (
                        <div className="text-xs text-gray-400 mt-1">{feature.us.detail}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`text-xl ${getStatusColor(feature.priceintelligently.has)}`}>
                      {getStatusIcon(feature.priceintelligently.has)}
                    </span>
                    {hoveredFeature === feature.name && (
                      <div className="text-xs text-gray-400 mt-1">{feature.priceintelligently.detail}</div>
                    )}
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`text-xl ${getStatusColor(feature.profitwell.has)}`}>
                      {getStatusIcon(feature.profitwell.has)}
                    </span>
                    {hoveredFeature === feature.name && (
                      <div className="text-xs text-gray-400 mt-1">{feature.profitwell.detail}</div>
                    )}
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`text-xl ${getStatusColor(feature.chargebee.has)}`}>
                      {getStatusIcon(feature.chargebee.has)}
                    </span>
                    {hoveredFeature === feature.name && (
                      <div className="text-xs text-gray-400 mt-1">{feature.chargebee.detail}</div>
                    )}
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`text-xl ${getStatusColor(feature.spreadsheet.has)}`}>
                      {getStatusIcon(feature.spreadsheet.has)}
                    </span>
                    {hoveredFeature === feature.name && (
                      <div className="text-xs text-gray-400 mt-1">{feature.spreadsheet.detail}</div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Summary section */}
      <motion.div 
        className="mt-12 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-2xl font-bold text-white mb-4">
          The Clear Winner: <span className="text-emerald-400">360x</span> More Affordable
        </h3>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          While competitors charge $599-$2,999 per month, we offer lifetime access for just $99. 
          That's not a typo - you save <span className="text-emerald-400 font-bold">$35,889</span> in the first year alone.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-emerald-400">5 min</div>
            <div className="text-gray-400">Setup time</div>
            <div className="text-xs text-gray-500 mt-1">vs 2-3 months</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">47x</div>
            <div className="text-gray-400">Average ROI</div>
            <div className="text-xs text-gray-500 mt-1">In first year</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400">$0</div>
            <div className="text-gray-400">Monthly fees</div>
            <div className="text-xs text-gray-500 mt-1">Forever</div>
          </div>
        </div>
        <motion.button
          onClick={() => {
            trackEvent('comparison_cta_clicked');
            window.location.href = '#pricing';
          }}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg shadow-2xl transform transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Lifetime Access for $99 →
        </motion.button>
      </motion.div>
    </div>
  );
}