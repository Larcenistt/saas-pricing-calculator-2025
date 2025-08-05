import { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';

export default function DemoSection() {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const [demoData, setDemoData] = useState({
    currentPrice: 49,
    competitors: 79,
    customers: 250
  });

  const [showResults, setShowResults] = useState(false);

  const calculateDemo = () => {
    setShowResults(true);
  };

  const recommendedPrice = Math.round(demoData.competitors * 0.9);
  const monthlyRevenue = recommendedPrice * demoData.customers;
  const yearlyRevenue = monthlyRevenue * 12;
  const revenueIncrease = Math.round(((recommendedPrice - demoData.currentPrice) / demoData.currentPrice) * 100);

  return (
    <section ref={ref} className="relative py-24 px-4 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">Try It </span>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Right Now
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            See how much revenue you're leaving on the table with this interactive demo
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Input Side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-8">
              <h3 className="text-2xl font-semibold text-white mb-8">
                Enter Your Current Metrics
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Current Price ($/month)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={demoData.currentPrice}
                      onChange={(e) => setDemoData({...demoData, currentPrice: parseInt(e.target.value) || 0})}
                      className="input-ultra pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Average Competitor Price ($/month)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={demoData.competitors}
                      onChange={(e) => setDemoData({...demoData, competitors: parseInt(e.target.value) || 0})}
                      className="input-ultra pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Customers
                  </label>
                  <input
                    type="number"
                    value={demoData.customers}
                    onChange={(e) => setDemoData({...demoData, customers: parseInt(e.target.value) || 0})}
                    className="input-ultra"
                  />
                </div>

                <Button
                  onClick={calculateDemo}
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon="💡"
                >
                  Calculate My Optimal Price
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Results Side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {!showResults ? (
              <div className="text-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-dashed border-gray-600"
                />
                <p className="text-gray-400">Your results will appear here</p>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GlassCard className="p-8 border-primary/30">
                  <h3 className="text-2xl font-semibold text-white mb-8">
                    Your Optimization Results
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Recommended Price */}
                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
                      <p className="text-sm text-gray-300 mb-2">Recommended Price</p>
                      <p className="text-5xl font-bold text-white">
                        ${recommendedPrice}
                        <span className="text-xl font-normal text-gray-400">/mo</span>
                      </p>
                      <p className="text-green-400 text-sm mt-2">
                        +{revenueIncrease}% increase
                      </p>
                    </div>

                    {/* Revenue Impact */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Monthly Revenue</p>
                        <p className="text-2xl font-semibold text-white">
                          ${monthlyRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Yearly Revenue</p>
                        <p className="text-2xl font-semibold text-white">
                          ${yearlyRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="pt-4">
                      <p className="text-center text-gray-400 mb-4">
                        This is just a simple demo. The full calculator includes 20+ metrics, 
                        competitor analysis, and AI recommendations.
                      </p>
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        icon="🚀"
                      >
                        Get Full Analysis for $99
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}