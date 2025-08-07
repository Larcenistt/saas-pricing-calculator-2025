import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import GlassCard from './ui/GlassCard';
import GradientButton from './ui/GradientButton';
import PremiumLoader from './ui/PremiumLoader';
import SuccessCelebration from './ui/SuccessCelebration';
import Button from './ui/Button';
import ProgressBar from './ProgressBar';
import { exportToPDF } from '../utils/exportPDF';
import { exportToPDFEnhanced } from '../utils/exportPDFEnhanced';
import { trackCalculatorUse, trackPDFExport } from '../utils/analytics';
import { saveCalculation, loadFromUrl, saveToUrl } from '../utils/savedCalculations';
import SavedCalculations from './SavedCalculations';
import FlashSaleBuyButton from './FlashSaleBuyButton';

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
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isWizardMode, setIsWizardMode] = useState(false);
  
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
        // Show toast instead of confirm
        toast((t) => (
          <div>
            <p className="mb-2">Clear all inputs?</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-red-500 text-white rounded"
                onClick={() => {
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
                  toast.dismiss(t.id);
                  toast.success('Form cleared');
                }}
              >
                Clear
              </button>
              <button
                className="px-3 py-1 bg-gray-500 text-white rounded"
                onClick={() => toast.dismiss(t.id)}
              >
                Cancel
              </button>
            </div>
          </div>
        ), { duration: 5000 });
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

  const calculateAdvancedMetrics = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    
    // Enhanced premium calculation process with WealthFlow branding
    const progressSteps = [
      { step: 8, message: 'Initializing WealthFlow AI engine...' },
      { step: 18, message: 'Parsing your business data...' },
      { step: 32, message: 'Analyzing competitor landscape...' },
      { step: 48, message: 'Computing advanced SaaS metrics...' },
      { step: 65, message: 'Running pricing optimization algorithms...' },
      { step: 78, message: 'Generating AI-powered insights...' },
      { step: 88, message: 'Calculating revenue projections...' },
      { step: 95, message: 'Finalizing your premium analysis...' },
      { step: 100, message: 'Analysis complete!' }
    ];
    
    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setCalculationProgress(progressStep.step);
      toast.loading(progressStep.message, { 
        id: 'calculation-progress',
        style: {
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981'
        }
      });
    }
    
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
    const ltv = churn > 0 ? (optimalPrice * contractLength) / (churn / 100) : optimalPrice * contractLength * 12;
    const ltvCacRatio = ltv / cac;
    const monthlyRevenue = customers * optimalPrice;
    const yearlyRevenue = monthlyRevenue * 12;
    const nrr = 100 + expansion - churn;
    const quickRatio = churn > 0 ? (expansion / 100) / (churn / 100) : expansion > 0 ? Infinity : 0;
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
      const growthRate = 1 + (expansion / 100 - churn / 100);
      const monthCustomers = Math.round(customers * (growthRate ** i));
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

    setIsCalculating(false);
    setCalculationProgress(0);
    toast.dismiss('calculation-progress');
    
    // Show premium success celebration
    setShowCelebration(true);
    
    toast.success('🎉 WealthFlow Analysis Complete! Your premium insights are ready.', {
      duration: 6000,
      style: {
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(30, 64, 175, 0.9))',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(12px)'
      },
    });
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1],
          type: 'spring',
          damping: 25,
          stiffness: 200
        }}
        className="w-full max-w-7xl mx-auto"
      >
        <GlassCard variant="default" glow animate className="p-8 lg:p-12">
          
          {/* Header Section with WealthFlow Branding */}
          <motion.div 
            className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 lg:mb-12 gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="flex-1">
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                WealthFlow
              </motion.h1>
              <motion.p 
                className="text-lg text-neutral-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                AI-Powered SaaS Pricing Intelligence Platform
              </motion.p>
            </div>
        
            {/* Premium Keyboard Shortcuts Guide */}
            <motion.div 
              className="hidden lg:block relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <details className="group">
                <summary className="cursor-pointer text-neutral-400 hover:text-white transition-all duration-200 
                                 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-glass-primary">
                  <span className="text-lg">⌨️</span>
                  <span className="font-medium">Shortcuts</span>
                </summary>
                <motion.div 
                  className="absolute right-0 top-full mt-2 p-4 bg-glass-surface border border-glass-border 
                           rounded-2xl backdrop-blur-xl shadow-premium z-20 min-w-[280px]"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Calculate</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">Ctrl</kbd>
                        <span className="text-neutral-500">+</span>
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">Enter</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Export PDF</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">Ctrl</kbd>
                        <span className="text-neutral-500">+</span>
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">E</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Navigate</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">←</kbd>
                        <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">→</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Clear form</span>
                      <kbd className="px-2 py-1 bg-neutral-800/50 border border-neutral-700 rounded-lg text-xs text-neutral-300">Esc</kbd>
                    </div>
                  </div>
                </motion.div>
              </details>
            </motion.div>
          </motion.div>
      
      {/* Progress Bar */}
      <ProgressBar 
        currentStep={currentStep}
        totalSteps={5}
        steps={progressSteps}
      />
      
          {/* Premium Save/Load Controls */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mt-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <GradientButton
              size="sm"
              variant="outline"
              onClick={() => setShowSaved(!showSaved)}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
              animate
            >
              {showSaved ? 'Hide Saved' : 'View Saved'}
            </GradientButton>
            
            <AnimatePresence>
              {results && (
                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <GradientButton
                    size="sm"
                    variant="glass"
                    onClick={handleSaveCalculation}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                      </svg>
                    }
                    animate
                  >
                    Save Analysis
                  </GradientButton>
                  <GradientButton
                    size="sm"
                    variant="glass"
                    onClick={handleShareCalculation}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    }
                    animate
                  >
                    Share Results
                  </GradientButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
      
      {/* Saved Calculations */}
      {showSaved && (
        <div className="mb-8">
          <SavedCalculations onLoad={handleLoadCalculation} />
        </div>
      )}
      
          {/* Premium Input Section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, staggerChildren: 0.1 }}
          >
            {[
              { name: 'currentPrice', label: 'Current Price', placeholder: '49', prefix: '$', suffix: '/mo', required: true },
              { name: 'competitorPrice', label: 'Competitor Price', placeholder: '79', prefix: '$', suffix: '/mo' },
              { name: 'customers', label: 'Current Customers', placeholder: '250', required: true },
              { name: 'churnRate', label: 'Monthly Churn', placeholder: '5', suffix: '%', required: true },
              { name: 'cac', label: 'Customer Acquisition Cost', placeholder: '100', prefix: '$' },
              { name: 'averageContractLength', label: 'Avg Contract Length', placeholder: '12', suffix: ' months' },
              { name: 'expansionRevenue', label: 'Expansion Revenue', placeholder: '10', suffix: '%' },
              { name: 'marketSize', label: 'Total Market Size', placeholder: '1000000', prefix: '$' }
            ].map((field, index) => (
              <motion.div
                key={field.name}
                className="group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <label className="block text-sm font-semibold text-neutral-300 mb-3 flex items-center gap-2">
                  {field.label}
                  {field.required && <span className="text-accent-400 text-xs">*</span>}
                </label>
                <div className="relative">
                  {field.prefix && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-sm font-medium">
                      {field.prefix}
                    </div>
                  )}
                  <motion.input
                    type="number"
                    name={field.name}
                    value={inputs[field.name]}
                    onChange={handleInputChange}
                    className={`
                      w-full px-4 py-3 bg-glass-surface border border-glass-border rounded-xl
                      text-white placeholder-neutral-500 transition-all duration-300
                      focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                      hover:border-glass-border-strong hover:bg-glass-primary/30
                      ${field.prefix ? 'pl-8' : ''}
                      ${field.suffix ? 'pr-16' : ''}
                      group-hover:shadow-glow/20
                    `}
                    placeholder={field.placeholder}
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  />
                  {field.suffix && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none text-sm font-medium">
                      {field.suffix}
                    </div>
                  )}
                  
                  {/* Input highlight effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 via-transparent to-secondary-500/10 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Premium Calculate Button */}
          <motion.div 
            className="flex justify-center mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.6, type: 'spring', damping: 20, stiffness: 300 }}
          >
            <GradientButton
              onClick={calculateAdvancedMetrics}
              variant="primary"
              size="xl"
              disabled={isCalculating}
              glow
              animate
              className="min-w-[320px] shadow-glow-lg"
              icon={isCalculating ? null : "✨"}
            >
              {isCalculating ? (
                <div className="flex items-center gap-4">
                  <PremiumLoader size="xs" variant="default" showMessage={false} />
                  <div className="text-center">
                    <div className="font-semibold">Analyzing Your Business</div>
                    <div className="text-sm opacity-80">{calculationProgress}% complete</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚀</span>
                  <div className="text-center">
                    <div className="font-bold">Generate AI Analysis</div>
                    <div className="text-sm opacity-90">Powered by WealthFlow Intelligence</div>
                  </div>
                </div>
              )}
            </GradientButton>
          </motion.div>
      
          {/* Premium Progress Bar during calculation */}
          <AnimatePresence>
            {isCalculating && (
              <motion.div 
                className="mb-12 max-w-lg mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard variant="primary" className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-white mb-2">WealthFlow AI Processing</h3>
                    <p className="text-neutral-300 text-sm">Our advanced algorithms are analyzing your business data...</p>
                  </div>
                  
                  <div className="relative">
                    <div className="bg-glass-surface rounded-full h-4 overflow-hidden backdrop-blur-lg border border-glass-border mb-3">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 relative overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: `${calculationProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-shimmer bg-[length:200%_100%]"></div>
                      </motion.div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Processing...</span>
                      <span className="font-mono font-semibold text-primary-400">{calculationProgress}%</span>
                    </div>
                  </div>
                  
                  {/* Processing indicators */}
                  <div className="flex justify-center items-center gap-2 mt-4">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-primary-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeInOut'
                        }}
                      />
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Flash Sale CTA */}
          <div className="max-w-md mx-auto mt-8 mb-8">
            <GlassCard className="border-2 border-green-500/50 bg-gradient-to-r from-green-900/20 to-blue-900/20">
              <h3 className="text-2xl font-bold text-center mb-4 text-white">Unlock Premium Features!</h3>
              <FlashSaleBuyButton />
            </GlassCard>
          </div>

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
        </GlassCard>
      </motion.div>

      {/* Success Celebration */}
      <SuccessCelebration
        isVisible={showCelebration}
        title="🎉 Analysis Complete!"
        message="Your WealthFlow pricing intelligence is ready to boost your revenue!"
        onComplete={() => setShowCelebration(false)}
        confettiOptions={{
          particleCount: 150,
          spread: 90,
          colors: ['#10b981', '#1e40af', '#f59e0b', '#34d399', '#60a5fa', '#fbbf24']
        }}
      />
    </>
  );
}