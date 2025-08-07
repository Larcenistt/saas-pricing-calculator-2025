import { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import LoadingScreen from '../components/LoadingScreen';
import PremiumLoader from '../components/ui/PremiumLoader';

// Lazy load heavy components - use the new premium Calculator
const Calculator = lazy(() => import('../components/Calculator'));
const CompetitorComparison = lazy(() => import('../components/CompetitorComparison'));

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');

  useEffect(() => {
    // Check if user has purchased
    // const purchased = localStorage.getItem('saas-calculator-purchased');
    // Temporarily allow access for development
    setHasAccess(true);
    // if (!purchased) {
    //   navigate('/');
    // } else {
    //   setHasAccess(true);
    // }
  }, [navigate]);

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-24 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
      <motion.div 
        className="max-w-8xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Premium Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 wf-gradient-text">
            WealthFlow Intelligence
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            Advanced AI-powered pricing optimization platform that transforms your SaaS business metrics 
            into actionable revenue growth strategies
          </p>
        </motion.div>

        {/* Premium Tab Navigation */}
        <motion.div 
          className="flex flex-wrap justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={() => setActiveTab('calculator')}
            className={`group px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === 'calculator'
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow scale-105'
                : 'bg-glass-surface border border-glass-border text-neutral-300 hover:bg-glass-primary hover:border-glass-border-strong hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="text-left">
                <div>AI Pricing Engine</div>
                <div className="text-xs opacity-75">Advanced calculations</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('comparison')}
            className={`group px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
              activeTab === 'comparison'
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-glow scale-105'
                : 'bg-glass-surface border border-glass-border text-neutral-300 hover:bg-glass-primary hover:border-glass-border-strong hover:scale-102'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-left">
                <div>Market Intelligence</div>
                <div className="text-xs opacity-75">Competitor analysis</div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Suspense fallback={
            <div className="flex justify-center py-20">
              <PremiumLoader 
                size="lg" 
                variant="default" 
                message="Loading WealthFlow Intelligence..."
              />
            </div>
          }>
            {activeTab === 'calculator' ? (
              <Calculator />
            ) : (
              <GlassCard variant="primary" glow className="p-8">
                <CompetitorComparison />
              </GlassCard>
            )}
          </Suspense>
        </motion.div>
      </motion.div>
    </div>
  );
}