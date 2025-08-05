import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calculator from '../components/Calculator';
import CompetitorComparison from '../components/CompetitorComparison';
import GlassCard from '../components/ui/GlassCard';

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
    <div className="min-h-screen pt-24 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Advanced Pricing Calculator
            </span>
          </h1>
          <p className="text-gray-400">
            Enter your metrics below to get AI-powered pricing recommendations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'calculator'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-glass-primary text-secondary hover:bg-glass-secondary'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Pricing Calculator
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'comparison'
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-glass-primary text-secondary hover:bg-glass-secondary'
            }`}
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Competitor Analysis
          </button>
        </div>

        <div>
          {activeTab === 'calculator' ? (
            <Calculator />
          ) : (
            <GlassCard className="p-8">
              <CompetitorComparison />
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}