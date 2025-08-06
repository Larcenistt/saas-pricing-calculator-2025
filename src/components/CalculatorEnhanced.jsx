import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Legend
} from 'recharts';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import useCalculationStore from '../stores/calculationStore';
import { exportToPDF } from '../utils/exportPDF';
import { exportToPDFEnhanced } from '../utils/exportPDFEnhanced';
import { trackCalculatorUse, trackPDFExport } from '../utils/analytics';
import { useCollaborativeCalculator } from '../hooks/useSocket';
import CollaborationIndicator from './CollaborationIndicator';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import ProgressBar from './ProgressBar';

export default function CalculatorEnhanced() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    saveCalculation, 
    updateCalculation, 
    fetchCalculation,
    shareCalculation,
    currentCalculation,
    isLoading 
  } = useCalculationStore();

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
  const [calculationName, setCalculationName] = useState('');
  const [calculationNotes, setCalculationNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Real-time collaboration
  const calculationId = searchParams.get('id') || currentCalculation?.id;
  const {
    collaborators,
    typingUsers,
    sendUpdate,
    handleTyping,
    onCalculationUpdate
  } = useCollaborativeCalculator(calculationId);

  // Load calculation if ID is provided
  useEffect(() => {
    const calcId = searchParams.get('id');
    const shareId = searchParams.get('share');
    
    if (calcId && isAuthenticated) {
      loadCalculation(calcId);
    } else if (shareId) {
      loadSharedCalculation(shareId);
    }
  }, [searchParams, isAuthenticated]);

  // Listen for real-time updates
  useEffect(() => {
    if (!calculationId) return;

    const unsubscribe = onCalculationUpdate((data) => {
      setInputs(data.inputs);
      setResults(data.results);
      toast(`Updated by ${data.updatedBy}`, {
        icon: '🔄',
        duration: 2000
      });
    });

    return unsubscribe;
  }, [calculationId, onCalculationUpdate]);

  const loadCalculation = async (id) => {
    const calc = await fetchCalculation(id);
    if (calc) {
      setInputs(calc.inputs);
      setResults(calc.results);
      setCalculationName(calc.name || '');
      setCalculationNotes(calc.notes || '');
      toast.success('Calculation loaded');
    }
  };

  const loadSharedCalculation = async (shareId) => {
    const { loadSharedCalculation } = useCalculationStore.getState();
    const calc = await loadSharedCalculation(shareId);
    if (calc) {
      setInputs(calc.inputs);
      setResults(calc.results);
      toast.success('Shared calculation loaded');
    }
  };

  // Calculate progress
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

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Send typing indicator for collaboration
    if (calculationId) {
      handleTyping();
    }
  }, [calculationId, handleTyping]);

  const calculatePricing = () => {
    const price = parseFloat(inputs.currentPrice) || 0;
    const competitor = parseFloat(inputs.competitorPrice) || price * 1.2;
    const customers = parseInt(inputs.customers) || 100;
    const churn = parseFloat(inputs.churnRate) || 5;
    const cac = parseFloat(inputs.cac) || 100;
    const contractLength = parseFloat(inputs.averageContractLength) || 12;
    const expansion = parseFloat(inputs.expansionRevenue) || 0;
    const marketSize = parseFloat(inputs.marketSize) || customers * 10;

    // Calculate LTV
    const monthlyRevenue = price;
    const avgCustomerLifespan = 1 / (churn / 100);
    const ltv = monthlyRevenue * avgCustomerLifespan + expansion;
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    // Pricing recommendations
    const recommendedPrice = competitor * 0.9;
    const premiumPrice = competitor * 1.1;
    const budgetPrice = competitor * 0.7;

    // Revenue projections
    const currentMRR = price * customers;
    const currentARR = currentMRR * 12;
    const projectedMRR = recommendedPrice * customers * (1 - churn / 100);
    const projectedARR = projectedMRR * 12;

    // Growth metrics
    const growthRate = ((projectedMRR - currentMRR) / currentMRR) * 100;
    const paybackPeriod = cac / monthlyRevenue;

    const calculatedResults = {
      metrics: {
        ltv: ltv.toFixed(2),
        cac: cac.toFixed(2),
        ltvCacRatio: ltvCacRatio.toFixed(2),
        churnRate: churn,
        paybackPeriod: paybackPeriod.toFixed(1),
        avgContractLength: contractLength
      },
      pricing: {
        current: price,
        recommended: recommendedPrice.toFixed(2),
        premium: premiumPrice.toFixed(2),
        budget: budgetPrice.toFixed(2),
        competitor: competitor
      },
      revenue: {
        currentMRR: currentMRR.toFixed(2),
        currentARR: currentARR.toFixed(2),
        projectedMRR: projectedMRR.toFixed(2),
        projectedARR: projectedARR.toFixed(2),
        growthRate: growthRate.toFixed(1)
      },
      market: {
        totalAddressableMarket: (marketSize * recommendedPrice * 12).toFixed(2),
        marketShare: ((customers / marketSize) * 100).toFixed(1),
        potentialCustomers: marketSize - customers
      }
    };

    setResults(calculatedResults);
    
    // Track calculation
    trackCalculatorUse({
      hasCompetitorPrice: !!inputs.competitorPrice,
      hasCAC: !!inputs.cac,
      hasExpansionRevenue: !!inputs.expansionRevenue,
      hasMarketSize: !!inputs.marketSize
    });

    // Send real-time update to collaborators
    if (calculationId) {
      sendUpdate(inputs, calculatedResults);
    }

    toast.success('Calculation complete! Review your results below.');
  };

  const handleSave = async () => {
    if (!results) {
      toast.error('Please calculate first before saving');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to save calculations', {
        duration: 5000,
        icon: '🔐'
      });
      navigate('/login', { state: { from: '/calculator' } });
      return;
    }

    setIsSaving(true);

    try {
      const calculationData = {
        name: calculationName || `Calculation ${new Date().toLocaleDateString()}`,
        inputs,
        results,
        notes: calculationNotes
      };

      if (currentCalculation?.id) {
        await updateCalculation(currentCalculation.id, calculationData);
        toast.success('Calculation updated successfully');
      } else {
        const saved = await saveCalculation(calculationData);
        if (saved) {
          navigate(`/calculator?id=${saved.id}`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!currentCalculation?.id) {
      toast.error('Please save the calculation first');
      return;
    }

    await shareCalculation(currentCalculation.id);
  };

  const handleExportPDF = (enhanced = false) => {
    if (!results) {
      toast.error('Please calculate first');
      return;
    }

    const exportData = {
      inputs,
      results,
      name: calculationName || 'Pricing Analysis',
      notes: calculationNotes,
      date: new Date().toLocaleDateString()
    };

    if (enhanced) {
      exportToPDFEnhanced(exportData);
    } else {
      exportToPDF(exportData);
    }

    trackPDFExport(enhanced ? 'professional' : 'simple');
    toast.success('PDF exported successfully');
  };

  // Generate chart data
  const getRevenueChartData = () => {
    if (!results) return [];
    
    const months = ['Current', 'Month 3', 'Month 6', 'Month 9', 'Month 12'];
    const baseRevenue = parseFloat(results.revenue.currentMRR);
    const growth = parseFloat(results.revenue.growthRate) / 100;
    
    return months.map((month, index) => ({
      month,
      revenue: (baseRevenue * Math.pow(1 + growth / 4, index)).toFixed(0)
    }));
  };

  const getPricingComparisonData = () => {
    if (!results) return [];
    
    return [
      { tier: 'Budget', price: parseFloat(results.pricing.budget), fill: '#10B981' },
      { tier: 'Current', price: parseFloat(results.pricing.current), fill: '#3B82F6' },
      { tier: 'Recommended', price: parseFloat(results.pricing.recommended), fill: '#F59E0B' },
      { tier: 'Premium', price: parseFloat(results.pricing.premium), fill: '#8B5CF6' },
      { tier: 'Competitor', price: parseFloat(results.pricing.competitor), fill: '#EF4444' }
    ];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Collaboration Indicator */}
      {calculationId && (
        <CollaborationIndicator 
          collaborators={collaborators}
          typingUsers={typingUsers}
        />
      )}
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Advanced Pricing Calculator
        </h1>
        <p className="text-xl text-muted max-w-3xl mx-auto">
          Optimize your SaaS pricing strategy with data-driven insights
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar currentStep={currentStep} />
      </div>

      {/* Calculator Form */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Basic Inputs */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Monthly Price ($)
              </label>
              <input
                type="number"
                name="currentPrice"
                value={inputs.currentPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 49"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Customers
              </label>
              <input
                type="number"
                name="customers"
                value={inputs.customers}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Churn Rate (%)
              </label>
              <input
                type="number"
                name="churnRate"
                value={inputs.churnRate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Competitor Average Price ($)
              </label>
              <input
                type="number"
                name="competitorPrice"
                value={inputs.competitorPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 59"
              />
            </div>
          </div>
        </GlassCard>

        {/* Advanced Inputs */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
            Advanced Metrics
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Customer Acquisition Cost ($)
              </label>
              <input
                type="number"
                name="cac"
                value={inputs.cac}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Average Contract Length (months)
              </label>
              <input
                type="number"
                name="averageContractLength"
                value={inputs.averageContractLength}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Monthly Expansion Revenue per Customer ($)
              </label>
              <input
                type="number"
                name="expansionRevenue"
                value={inputs.expansionRevenue}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Total Addressable Market (customers)
              </label>
              <input
                type="number"
                name="marketSize"
                value={inputs.marketSize}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 10000"
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Calculation Details (if logged in) */}
      {isAuthenticated && (
        <GlassCard className="p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Calculation Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Calculation Name
              </label>
              <input
                type="text"
                value={calculationName}
                onChange={(e) => setCalculationName(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Q4 2024 Pricing Strategy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes
              </label>
              <input
                type="text"
                value={calculationNotes}
                onChange={(e) => setCalculationNotes(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add any notes or context"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-8">
        <Button
          onClick={calculatePricing}
          variant="primary"
          size="lg"
          className="min-w-[200px]"
        >
          Calculate Pricing
        </Button>
        
        {results && (
          <>
            <Button
              onClick={handleSave}
              variant="secondary"
              size="lg"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : currentCalculation ? 'Update' : 'Save'}
            </Button>
            
            {currentCalculation && (
              <Button
                onClick={handleShare}
                variant="secondary"
                size="lg"
              >
                Share
              </Button>
            )}
            
            <Button
              onClick={() => handleExportPDF(false)}
              variant="secondary"
              size="lg"
            >
              Export PDF
            </Button>
            
            <Button
              onClick={() => handleExportPDF(true)}
              variant="secondary"
              size="lg"
            >
              Export Pro PDF
            </Button>
          </>
        )}
      </div>

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['metrics', 'pricing', 'revenue', 'charts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'metrics' && (
            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-2">LTV:CAC Ratio</h3>
                <div className="text-3xl font-bold gradient-text">
                  {results.metrics.ltvCacRatio}:1
                </div>
                <p className="text-sm text-muted mt-2">
                  {results.metrics.ltvCacRatio >= 3 ? 'Healthy' : 'Needs improvement'}
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-2">Customer LTV</h3>
                <div className="text-3xl font-bold text-green-500">
                  ${results.metrics.ltv}
                </div>
                <p className="text-sm text-muted mt-2">
                  Lifetime value per customer
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-2">Payback Period</h3>
                <div className="text-3xl font-bold text-yellow-500">
                  {results.metrics.paybackPeriod} mo
                </div>
                <p className="text-sm text-muted mt-2">
                  Time to recover CAC
                </p>
              </GlassCard>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(results.pricing).map(([key, value]) => (
                <GlassCard key={key} className="p-6">
                  <h3 className="text-lg font-semibold mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="text-3xl font-bold">
                    ${value}
                  </div>
                  {key === 'recommended' && (
                    <p className="text-sm text-green-500 mt-2">Optimal price point</p>
                  )}
                </GlassCard>
              ))}
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="grid md:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Current Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">MRR</span>
                    <span className="font-bold">${results.revenue.currentMRR}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">ARR</span>
                    <span className="font-bold">${results.revenue.currentARR}</span>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Projected Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted">MRR</span>
                    <span className="font-bold text-green-500">${results.revenue.projectedMRR}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">ARR</span>
                    <span className="font-bold text-green-500">${results.revenue.projectedARR}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Growth</span>
                    <span className="font-bold text-primary">+{results.revenue.growthRate}%</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Revenue Projection</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getRevenueChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Pricing Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getPricingComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="tier" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="price" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}