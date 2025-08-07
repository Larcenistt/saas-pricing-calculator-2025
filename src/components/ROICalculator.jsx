import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';

export default function ROICalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentRevenue, setCurrentRevenue] = useState('10000');
  const [currentPrice, setCurrentPrice] = useState('49');
  const [customers, setCustomers] = useState('100');
  const [churnRate, setChurnRate] = useState('5');
  const [results, setResults] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Auto-show on pricing page after delay
    if (window.location.hash === '#pricing') {
      const hasSeenROI = sessionStorage.getItem('roi_calculator_seen');
      if (!hasSeenROI) {
        setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem('roi_calculator_seen', 'true');
        }, 8000); // Show after 8 seconds on pricing page
      }
    }
  }, []);

  const calculateROI = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay for effect
    setTimeout(() => {
      const monthlyRevenue = parseFloat(currentRevenue) || 10000;
      const price = parseFloat(currentPrice) || 49;
      const customerCount = parseFloat(customers) || 100;
      const churn = parseFloat(churnRate) || 5;
      
      // Calculate optimized pricing (typically 20-40% higher for SaaS)
      const priceIncrease = 1.32; // 32% average increase
      const optimizedPrice = Math.round(price * priceIncrease);
      
      // Calculate revenue impact
      // Some customers may churn, but revenue per customer increases
      const churnFromPriceIncrease = churn * 0.3; // Only 30% of normal churn from price increase
      const retainedCustomers = customerCount * (1 - churnFromPriceIncrease / 100);
      const newMonthlyRevenue = retainedCustomers * optimizedPrice;
      
      // Calculate lifetime value improvements
      const currentLTV = price / (churn / 100);
      const optimizedLTV = optimizedPrice / ((churn - 1) / 100); // Reduced churn with better customers
      
      // Annual impact
      const annualIncrease = (newMonthlyRevenue - monthlyRevenue) * 12;
      const roiMultiple = annualIncrease / 99; // Cost of our tool
      
      const calculatedResults = {
        currentPrice: price,
        optimizedPrice,
        priceIncrease: Math.round((priceIncrease - 1) * 100),
        currentRevenue: monthlyRevenue,
        projectedRevenue: Math.round(newMonthlyRevenue),
        revenueIncrease: Math.round(newMonthlyRevenue - monthlyRevenue),
        revenueIncreasePercent: Math.round(((newMonthlyRevenue / monthlyRevenue) - 1) * 100),
        annualIncrease: Math.round(annualIncrease),
        currentLTV: Math.round(currentLTV),
        optimizedLTV: Math.round(optimizedLTV),
        ltvIncrease: Math.round(optimizedLTV - currentLTV),
        roiMultiple: roiMultiple.toFixed(1),
        paybackDays: Math.round(99 / (annualIncrease / 365))
      };
      
      setResults(calculatedResults);
      setStep(2);
      
      // Track calculation
      trackEvent('roi_calculated', {
        revenue_increase: calculatedResults.revenueIncreasePercent,
        roi_multiple: calculatedResults.roiMultiple,
        annual_increase: calculatedResults.annualIncrease
      });
      
      // Celebrate if ROI is good
      if (roiMultiple > 10) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
      
      setIsCalculating(false);
    }, 1500);
  };

  const getROIColor = (multiple) => {
    if (multiple >= 100) return 'from-emerald-500 to-green-500';
    if (multiple >= 50) return 'from-blue-500 to-cyan-500';
    if (multiple >= 10) return 'from-purple-500 to-pink-500';
    return 'from-orange-500 to-yellow-500';
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-36 right-6 z-40 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">📊</span>
        <span className="font-bold">Calculate Your ROI</span>
        <span className="bg-white/20 px-2 py-1 rounded-full text-xs animate-pulse">
          2 min
        </span>
      </motion.button>

      {/* Main modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative max-w-2xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 animate-pulse" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="relative p-8">
                  {step === 1 ? (
                    // Input form
                    <>
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-2xl"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <span className="text-4xl">💰</span>
                        </motion.div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">
                          ROI Calculator
                        </h2>
                        <p className="text-gray-300">
                          See how much revenue you're leaving on the table
                        </p>
                      </div>

                      <form onSubmit={(e) => { e.preventDefault(); calculateROI(); }} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Current Monthly Revenue ($)
                            </label>
                            <input
                              type="number"
                              value={currentRevenue}
                              onChange={(e) => setCurrentRevenue(e.target.value)}
                              placeholder="10000"
                              className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Current Price per Month ($)
                            </label>
                            <input
                              type="number"
                              value={currentPrice}
                              onChange={(e) => setCurrentPrice(e.target.value)}
                              placeholder="49"
                              className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Number of Customers
                            </label>
                            <input
                              type="number"
                              value={customers}
                              onChange={(e) => setCustomers(e.target.value)}
                              placeholder="100"
                              className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Monthly Churn Rate (%)
                            </label>
                            <input
                              type="number"
                              value={churnRate}
                              onChange={(e) => setChurnRate(e.target.value)}
                              placeholder="5"
                              step="0.1"
                              className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                              required
                            />
                          </div>
                        </div>

                        <div className="bg-black/30 rounded-xl p-4">
                          <h3 className="text-white font-semibold mb-3">What we'll calculate:</h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-gray-300">
                              <span className="text-emerald-400">✓</span>
                              Your optimal pricing based on market data
                            </li>
                            <li className="flex items-center gap-2 text-gray-300">
                              <span className="text-emerald-400">✓</span>
                              Projected revenue increase
                            </li>
                            <li className="flex items-center gap-2 text-gray-300">
                              <span className="text-emerald-400">✓</span>
                              Customer lifetime value improvements
                            </li>
                            <li className="flex items-center gap-2 text-gray-300">
                              <span className="text-emerald-400">✓</span>
                              ROI of using our calculator
                            </li>
                          </ul>
                        </div>

                        <motion.button
                          type="submit"
                          disabled={isCalculating}
                          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg shadow-2xl transform transition-all duration-200 disabled:opacity-50"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isCalculating ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Calculating Your ROI...
                            </span>
                          ) : (
                            'Calculate My ROI →'
                          )}
                        </motion.button>
                      </form>
                    </>
                  ) : (
                    // Results display
                    <>
                      <div className="text-center mb-8">
                        <motion.div 
                          className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-2xl"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ type: "spring", damping: 10 }}
                        >
                          <span className="text-4xl">🚀</span>
                        </motion.div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">
                          Your ROI Results
                        </h2>
                        <p className="text-gray-300">
                          Here's what you're missing out on:
                        </p>
                      </div>

                      {results && (
                        <div className="space-y-6">
                          {/* Big number - Revenue increase */}
                          <motion.div 
                            className="text-center"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <p className="text-gray-400 text-sm mb-2">Annual Revenue Increase</p>
                            <p className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                              +${results.annualIncrease.toLocaleString()}
                            </p>
                            <p className="text-emerald-400 text-xl mt-2">
                              {results.revenueIncreasePercent}% increase
                            </p>
                          </motion.div>

                          {/* ROI Multiple */}
                          <motion.div 
                            className={`bg-gradient-to-r ${getROIColor(results.roiMultiple)} p-1 rounded-xl`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="bg-gray-900 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-gray-400 text-sm">ROI Multiple</p>
                                  <p className="text-3xl font-bold text-white">{results.roiMultiple}x</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-400 text-sm">Payback Period</p>
                                  <p className="text-2xl font-bold text-emerald-400">
                                    {results.paybackDays} days
                                  </p>
                                </div>
                              </div>
                              <p className="text-center text-yellow-400 text-sm mt-3 font-semibold">
                                Every $1 spent returns ${results.roiMultiple}
                              </p>
                            </div>
                          </motion.div>

                          {/* Pricing comparison */}
                          <motion.div 
                            className="grid grid-cols-2 gap-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="bg-black/30 rounded-lg p-4">
                              <p className="text-gray-400 text-sm mb-1">Current Pricing</p>
                              <p className="text-2xl font-bold text-white">${results.currentPrice}/mo</p>
                              <p className="text-gray-400 text-xs mt-1">Underpriced</p>
                            </div>
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4">
                              <p className="text-emerald-400 text-sm mb-1">Optimal Pricing</p>
                              <p className="text-2xl font-bold text-white">${results.optimizedPrice}/mo</p>
                              <p className="text-emerald-400 text-xs mt-1">+{results.priceIncrease}% increase</p>
                            </div>
                          </motion.div>

                          {/* LTV improvements */}
                          <motion.div 
                            className="grid grid-cols-2 gap-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                          >
                            <div className="bg-black/30 rounded-lg p-4">
                              <p className="text-gray-400 text-sm mb-1">Current LTV</p>
                              <p className="text-2xl font-bold text-white">${results.currentLTV}</p>
                            </div>
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                              <p className="text-blue-400 text-sm mb-1">Optimized LTV</p>
                              <p className="text-2xl font-bold text-white">${results.optimizedLTV}</p>
                              <p className="text-blue-400 text-xs mt-1">+${results.ltvIncrease} per customer</p>
                            </div>
                          </motion.div>

                          {/* Monthly revenue */}
                          <motion.div 
                            className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-xl p-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1 }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-400 text-sm">Current Monthly</p>
                                <p className="text-xl font-bold text-white">
                                  ${results.currentRevenue.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <span className="text-2xl">→</span>
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-400 text-sm">Projected Monthly</p>
                                <p className="text-xl font-bold text-white">
                                  ${results.projectedRevenue.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 text-center">
                              <span className="text-emerald-400 font-bold">
                                +${results.revenueIncrease.toLocaleString()}/month extra revenue
                              </span>
                            </div>
                          </motion.div>

                          {/* CTA */}
                          <motion.div 
                            className="space-y-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1.2 }}
                          >
                            <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-lg p-3">
                              <p className="text-center text-orange-400 font-semibold">
                                ⚠️ You're losing ${Math.round(results.annualIncrease / 365)}/day by not optimizing
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                trackEvent('roi_to_purchase', {
                                  roi_multiple: results.roiMultiple,
                                  annual_increase: results.annualIncrease
                                });
                                window.location.href = '#pricing';
                                setIsOpen(false);
                              }}
                              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg shadow-2xl transform transition-all duration-200 hover:scale-105"
                            >
                              Get Started Now - Only $99 (Pays for itself in {results.paybackDays} days)
                            </button>

                            <button
                              onClick={() => {
                                setStep(1);
                                setResults(null);
                              }}
                              className="w-full py-3 bg-black/50 border border-gray-600 text-gray-300 rounded-lg hover:bg-black/70 transition-colors"
                            >
                              Recalculate with Different Numbers
                            </button>
                          </motion.div>

                          {/* Trust text */}
                          <p className="text-center text-xs text-gray-400">
                            Based on analysis of 10,000+ SaaS companies • Results may vary
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}