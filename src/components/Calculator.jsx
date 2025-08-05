import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import ProgressBar from './ProgressBar';
import { exportToPDF } from '../utils/exportPDF';
import { exportToPDFEnhanced } from '../utils/exportPDFEnhanced';
import { trackCalculatorUse, trackPDFExport } from '../utils/analytics';
import { saveCalculation, loadFromUrl, saveToUrl } from '../utils/savedCalculations';
import SavedCalculations from './SavedCalculations';

export default function Calculator() {
  const [showSaved, setShowSaved] = useState(false);
  const [inputs, setInputs] = useState({
    currentPrice: '',
    competitorPrice: '',
    customers: '',
    churnRate: '',
    cac: '',
    averageContractLength: '',
    expansionRevenue: '',
    marketSize: ''
  });

  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [currentStep, setCurrentStep] = useState(1);
  
  // Calculate progress based on filled inputs
  const calculateProgress = () => {
    const requiredFields = ['currentPrice', 'customers', 'churnRate'];
    const optionalFields = ['competitorPrice', 'cac', 'averageContractLength', 'expansionRevenue', 'marketSize'];
    
    let filledRequired = requiredFields.filter(field => inputs[field]).length;
    let filledOptional = optionalFields.filter(field => inputs[field]).length;
    
    if (filledRequired === 0) return 1;
    if (filledRequired < 3) return 2;
    if (filledOptional === 0) return 3;
    if (filledOptional < 5) return 4;
    return 5;
  };
  
  useEffect(() => {
    setCurrentStep(calculateProgress());
  }, [inputs]);
  
  // Check for shared calculation on load
  useEffect(() => {
    const shared = loadFromUrl();
    if (shared) {
      if (shared.inputs) {
        setInputs(shared.inputs);
      }
      if (shared.results) {
        setResults(shared.results);
      }
      toast.success('Calculation loaded from share link');
    }
  }, []);
  
  const handleSaveCalculation = () => {
    if (!results) {
      toast.error('Please calculate first before saving');
      return;
    }
    
    const name = prompt('Enter a name for this calculation:');
    if (name) {
      const saved = saveCalculation({
        name,
        inputs,
        results
      });
      
      if (saved) {
        toast.success('Calculation saved successfully!');
      } else {
        toast.error('Failed to save calculation');
      }
    }
  };
  
  const handleLoadCalculation = (calculation) => {
    setInputs(calculation.inputs);
    setResults(calculation.results);
    setShowSaved(false);
    toast.success('Calculation loaded');
  };
  
  const handleShareCalculation = () => {
    if (!results) {
      toast.error('Please calculate first before sharing');
      return;
    }
    
    const shareUrl = saveToUrl({ inputs, results });
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Share link copied to clipboard!');
      });
    }
  };
  
  const tabs = [
    { id: 'metrics', label: 'Key Metrics', icon: '📊' },
    { id: 'pricing', label: 'Pricing Tiers', icon: '💰' },
    { id: 'projections', label: 'Projections', icon: '📈' },
    { id: 'insights', label: 'AI Insights', icon: '🤖' }
  ];
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Enter to calculate
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        calculateAdvancedMetrics();
      }
      
      // Ctrl/Cmd + E to export PDF
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (results) {
          exportToPDFEnhanced(results);
          trackPDFExport('professional');
        }
      }
      
      // Tab navigation between tabs
      if (e.key === 'ArrowLeft' && results) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        const newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        setActiveTab(tabs[newIndex].id);
      }
      
      if (e.key === 'ArrowRight' && results) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        const newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        setActiveTab(tabs[newIndex].id);
      }
      
      // Escape to clear form
      if (e.key === 'Escape') {
        e.preventDefault();
        if (confirm('Clear all inputs?')) {
          setInputs({
            currentPrice: '',
            competitorPrice: '',
            customers: '',
            churnRate: '',
            cac: '',
            averageContractLength: '',
            expansionRevenue: '',
            marketSize: ''
          });
          setResults(null);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [results, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateAdvancedMetrics = () => {
    // Parse inputs
    const current = parseFloat(inputs.currentPrice) || 0;
    const competitor = parseFloat(inputs.competitorPrice) || 0;
    const customers = parseInt(inputs.customers) || 0;
    const churn = parseFloat(inputs.churnRate) || 5;
    const cac = parseFloat(inputs.cac) || 100;
    const contractLength = parseFloat(inputs.averageContractLength) || 12;
    const expansion = parseFloat(inputs.expansionRevenue) || 10;
    const marketSize = parseFloat(inputs.marketSize) || 1000000;

    // Advanced calculations
    const optimalPrice = competitor > 0 ? competitor * 0.85 : current * 1.35;
    const ltv = (optimalPrice * contractLength) / (churn / 100);
    const ltvCacRatio = ltv / cac;
    const monthlyRevenue = customers * optimalPrice;
    const yearlyRevenue = monthlyRevenue * 12;
    const nrr = 100 + expansion - churn;
    const quickRatio = (expansion / 100) / (churn / 100);
    const magicNumber = (yearlyRevenue - (yearlyRevenue * 0.8)) / (cac * customers * 0.25);
    const ruleOf40 = (yearlyRevenue / (yearlyRevenue * 0.8) - 1) * 100 + (100 - churn);
    const paybackPeriod = cac / optimalPrice;
    const tam = marketSize * optimalPrice * 12;
    const marketShare = (yearlyRevenue / tam) * 100;

    // Pricing tiers with AI recommendations
    const tiers = {
      starter: {
        name: 'Starter',
        price: Math.round(optimalPrice * 0.6),
        features: [
          'Up to 10 users',
          'Core features',
          'Email support',
          'Basic analytics',
          '99.9% uptime SLA'
        ],
        targetSegment: 'Small teams and startups',
        projectedAdoption: '40%'
      },
      professional: {
        name: 'Professional',
        price: Math.round(optimalPrice),
        features: [
          'Up to 50 users',
          'All features',
          'Priority support',
          'Advanced analytics',
          'API access',
          'Custom integrations',
          '99.99% uptime SLA'
        ],
        recommended: true,
        targetSegment: 'Growing businesses',
        projectedAdoption: '45%'
      },
      enterprise: {
        name: 'Enterprise',
        price: Math.round(optimalPrice * 2.2),
        features: [
          'Unlimited users',
          'White-label options',
          'Dedicated support',
          'Custom features',
          'On-premise deployment',
          'Advanced security',
          'Custom SLA'
        ],
        targetSegment: 'Large organizations',
        projectedAdoption: '15%'
      }
    };

    // Revenue projections data
    const projectionData = [];
    for (let i = 0; i <= 12; i++) {
      const monthCustomers = Math.round(customers * Math.pow(1 + (expansion / 100 - churn / 100), i));
      projectionData.push({
        month: i,
        revenue: monthCustomers * optimalPrice,
        customers: monthCustomers,
        mrr: monthCustomers * optimalPrice
      });
    }

    // Competitor comparison data
    const competitorData = [
      { metric: 'Price', you: current, competitor: competitor, optimal: optimalPrice },
      { metric: 'LTV', you: (current * contractLength) / (churn / 100), competitor: (competitor * contractLength) / (churn / 100), optimal: ltv },
      { metric: 'Market Position', you: current / competitor * 100, competitor: 100, optimal: 85 }
    ];

    // SaaS metrics radar chart data
    const metricsRadar = [
      { metric: 'LTV:CAC', value: Math.min(ltvCacRatio / 5 * 100, 100), benchmark: 60 },
      { metric: 'NRR', value: Math.min(nrr / 150 * 100, 100), benchmark: 70 },
      { metric: 'Quick Ratio', value: Math.min(quickRatio / 4 * 100, 100), benchmark: 50 },
      { metric: 'Rule of 40', value: Math.min(ruleOf40 / 60 * 100, 100), benchmark: 66 },
      { metric: 'Payback', value: Math.min((12 / paybackPeriod) * 100, 100), benchmark: 75 },
      { metric: 'Growth', value: Math.min(expansion / 30 * 100, 100), benchmark: 60 }
    ];

    const calculatedResults = {
      tiers,
      metrics: {
        optimalPrice: Math.round(optimalPrice),
        ltv: Math.round(ltv),
        ltvCacRatio: ltvCacRatio.toFixed(2),
        monthlyRevenue: Math.round(monthlyRevenue),
        yearlyRevenue: Math.round(yearlyRevenue),
        nrr: Math.round(nrr),
        quickRatio: quickRatio.toFixed(2),
        magicNumber: magicNumber.toFixed(2),
        ruleOf40: Math.round(ruleOf40),
        paybackPeriod: Math.round(paybackPeriod),
        marketShare: marketShare.toFixed(2),
        priceIncrease: Math.round(((optimalPrice - current) / current) * 100)
      },
      projectionData,
      competitorData,
      metricsRadar,
      insights: generateInsights(ltvCacRatio, nrr, quickRatio, ruleOf40, current, optimalPrice)
    };
    
    setResults(calculatedResults);
    
    // Track calculator usage
    trackCalculatorUse({
      recommendedPrice: optimalPrice,
      currentPrice: current,
      customers: customers,
      priceIncrease: Math.round(((optimalPrice - current) / current) * 100)
    });

    toast.success('Analysis complete! Check out your personalized recommendations.');
  };

  const generateInsights = (ltvCac, nrr, quickRatio, rule40, current, optimal) => {
    const insights = [];
    
    if (ltvCac < 3) {
      insights.push({
        type: 'warning',
        title: 'LTV:CAC Ratio Below Target',
        message: `Your LTV:CAC ratio of ${ltvCac.toFixed(2)} is below the healthy threshold of 3. Consider increasing prices or reducing acquisition costs.`
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Healthy Unit Economics',
        message: `Your LTV:CAC ratio of ${ltvCac.toFixed(2)} indicates strong unit economics. You're spending efficiently on customer acquisition.`
      });
    }

    if (optimal > current * 1.2) {
      insights.push({
        type: 'opportunity',
        title: 'Significant Pricing Opportunity',
        message: `You're underpriced by ${Math.round(((optimal - current) / current) * 100)}%. Gradually increasing prices could significantly boost revenue.`
      });
    }

    if (nrr > 110) {
      insights.push({
        type: 'success',
        title: 'Excellent Net Revenue Retention',
        message: `Your NRR of ${Math.round(nrr)}% shows strong expansion revenue. This is a key indicator of product-market fit.`
      });
    }

    if (rule40 > 40) {
      insights.push({
        type: 'success',
        title: 'Rule of 40 Achieved',
        message: `Your Rule of 40 score of ${Math.round(rule40)} puts you in elite company. You're balancing growth and profitability well.`
      });
    }

    return insights;
  };

  const progressSteps = ['Start', 'Basic Info', 'Market Data', 'Advanced Metrics', 'Results'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card-pro p-8"
    >
      <div className="flex justify-between items-start mb-8">
        <h2 className="text-3xl font-bold holographic">Advanced SaaS Pricing Calculator</h2>
        
        {/* Keyboard Shortcuts Guide */}
        <div className="hidden md:block">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-white transition-colors">
              ⌨️ Shortcuts
            </summary>
            <div className="absolute right-0 mt-2 p-4 glass rounded-lg text-gray-300 z-10">
              <div className="space-y-1">
                <p><kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Enter</kbd> = Calculate</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">E</kbd> = Export PDF</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded text-xs">←</kbd> <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">→</kbd> = Navigate tabs</p>
                <p><kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Esc</kbd> = Clear form</p>
              </div>
            </div>
          </details>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={currentStep}
        totalSteps={5}
        steps={progressSteps}
      />
      
      {/* Save/Load Controls */}
      <div className="flex justify-center gap-3 mt-6 mb-6">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowSaved(!showSaved)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          {showSaved ? 'Hide Saved' : 'View Saved'}
        </Button>
        {results && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveCalculation}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
              </svg>
              Save
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleShareCalculation}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </Button>
          </>
        )}
      </div>
      
      {/* Saved Calculations */}
      {showSaved && (
        <div className="mb-8">
          <SavedCalculations onLoad={handleLoadCalculation} />
        </div>
      )}
      
      {/* Input Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Price ($/mo)
          </label>
          <input
            type="number"
            name="currentPrice"
            value={inputs.currentPrice}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="49"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Competitor Price ($/mo)
          </label>
          <input
            type="number"
            name="competitorPrice"
            value={inputs.competitorPrice}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="79"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Customers
          </label>
          <input
            type="number"
            name="customers"
            value={inputs.customers}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="250"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Monthly Churn (%)
          </label>
          <input
            type="number"
            name="churnRate"
            value={inputs.churnRate}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CAC ($)
          </label>
          <input
            type="number"
            name="cac"
            value={inputs.cac}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Avg Contract (months)
          </label>
          <input
            type="number"
            name="averageContractLength"
            value={inputs.averageContractLength}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="12"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Expansion Revenue (%)
          </label>
          <input
            type="number"
            name="expansionRevenue"
            value={inputs.expansionRevenue}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Total Market Size ($)
          </label>
          <input
            type="number"
            name="marketSize"
            value={inputs.marketSize}
            onChange={handleInputChange}
            className="input-futuristic"
            placeholder="1000000"
          />
        </div>
      </div>

      {/* Calculate Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={calculateAdvancedMetrics}
          variant="primary"
          size="lg"
          icon="🚀"
          className="shadow-2xl shadow-primary/30"
        >
          Generate AI-Powered Analysis
        </Button>
      </div>

      {/* Results Section */}
      {results && (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* Key Metrics Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Optimal Price</p>
                  <p className="text-4xl font-bold text-white">
                    ${results.metrics.optimalPrice}
                    <span className="text-lg font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-green-400 text-sm mt-2">
                    +{results.metrics.priceIncrease}% increase
                  </p>
                </GlassCard>

                <GlassCard className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Projected ARR</p>
                  <p className="text-4xl font-bold text-white">
                    ${(results.metrics.yearlyRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="text-blue-400 text-sm mt-2">
                    ${results.metrics.monthlyRevenue.toLocaleString()} MRR
                  </p>
                </GlassCard>

                <GlassCard className="text-center">
                  <p className="text-sm text-gray-400 mb-2">LTV:CAC Ratio</p>
                  <p className="text-4xl font-bold text-white">
                    {results.metrics.ltvCacRatio}x
                  </p>
                  <p className={`text-sm mt-2 ${results.metrics.ltvCacRatio >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {results.metrics.ltvCacRatio >= 3 ? 'Healthy' : 'Needs Improvement'}
                  </p>
                </GlassCard>
              </div>

              {/* SaaS Metrics Radar */}
              <GlassCard>
                <h3 className="text-xl font-semibold text-white mb-4">SaaS Health Score</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={results.metricsRadar}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="metric" stroke="#666" />
                      <PolarRadiusAxis stroke="#666" domain={[0, 100]} />
                      <Radar name="Your Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Radar name="Benchmark" dataKey="benchmark" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Additional Metrics */}
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: 'NRR', value: `${results.metrics.nrr}%`, color: results.metrics.nrr > 110 ? 'text-green-400' : 'text-yellow-400' },
                  { label: 'Quick Ratio', value: results.metrics.quickRatio, color: results.metrics.quickRatio > 2 ? 'text-green-400' : 'text-yellow-400' },
                  { label: 'Rule of 40', value: results.metrics.ruleOf40, color: results.metrics.ruleOf40 > 40 ? 'text-green-400' : 'text-yellow-400' },
                  { label: 'Payback', value: `${results.metrics.paybackPeriod} mo`, color: results.metrics.paybackPeriod < 12 ? 'text-green-400' : 'text-yellow-400' }
                ].map((metric, index) => (
                  <GlassCard key={index} className="text-center py-4">
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {Object.values(results.tiers).map((tier) => (
                  <GlassCard
                    key={tier.name}
                    className={tier.recommended ? 'border-primary/50' : ''}
                    glow={tier.recommended}
                  >
                    {tier.recommended && (
                      <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-4">
                        AI RECOMMENDED
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
                    <p className="text-3xl font-bold text-white mb-1">
                      ${tier.price}
                      <span className="text-sm font-normal text-gray-400">/mo</span>
                    </p>
                    <p className="text-sm text-gray-400 mb-4">{tier.targetSegment}</p>
                    <p className="text-sm text-blue-400 mb-6">
                      Projected: {tier.projectedAdoption} of customers
                    </p>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>
                ))}
              </div>

              {/* Competitor Comparison */}
              <GlassCard>
                <h3 className="text-xl font-semibold text-white mb-4">Market Positioning</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.competitorData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="metric" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 17, 17, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="you" fill="#EF4444" name="Current" />
                      <Bar dataKey="competitor" fill="#F59E0B" name="Competitor" />
                      <Bar dataKey="optimal" fill="#10B981" name="Optimal" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="space-y-6">
              <GlassCard>
                <h3 className="text-xl font-semibold text-white mb-4">12-Month Revenue Projection</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.projectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="#666" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(17, 17, 17, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} />
                      <Line type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} yAxisId="right" />
                      <YAxis yAxisId="right" orientation="right" stroke="#666" />
                      <Legend />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Month 1</p>
                    <p className="text-xl font-semibold text-white">
                      ${results.projectionData[1]?.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Month 6</p>
                    <p className="text-xl font-semibold text-white">
                      ${results.projectionData[6]?.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Month 12</p>
                    <p className="text-xl font-semibold text-white">
                      ${results.projectionData[12]?.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {results.insights.map((insight, index) => (
                <GlassCard
                  key={index}
                  className={`border-l-4 ${
                    insight.type === 'success' ? 'border-green-500' :
                    insight.type === 'warning' ? 'border-yellow-500' :
                    'border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`text-2xl ${
                      insight.type === 'success' ? 'text-green-500' :
                      insight.type === 'warning' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {insight.type === 'success' ? '✅' :
                       insight.type === 'warning' ? '⚠️' : '💡'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
                      <p className="text-gray-300">{insight.message}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}

              <GlassCard gradient>
                <h4 className="font-semibold text-white mb-4">📋 Recommended Next Steps</h4>
                <ol className="space-y-2 text-gray-300">
                  <li>1. Test price increase with 10% of new customers</li>
                  <li>2. Survey existing customers about value perception</li>
                  <li>3. Analyze feature usage to optimize tier packaging</li>
                  <li>4. Implement expansion revenue strategies</li>
                  <li>5. Review and optimize customer acquisition costs</li>
                </ol>
              </GlassCard>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button
              onClick={() => {
                exportToPDF(results);
                trackPDFExport('simple');
              }}
              variant="glass"
              icon="📄"
            >
              Export Simple Report
            </Button>
            <Button
              onClick={() => {
                exportToPDFEnhanced(results);
                trackPDFExport('professional');
              }}
              variant="primary"
              icon="📊"
            >
              Export Professional Analysis
            </Button>
            <Button
              onClick={handleSaveCalculation}
              variant="secondary"
              icon="💾"
            >
              Save Calculation
            </Button>
            <Button
              onClick={handleShareCalculation}
              variant="secondary"
              icon="🔗"
            >
              Share Results
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}