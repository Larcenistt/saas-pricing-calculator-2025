import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UrgencyCountdown from './UrgencyCountdown';

export default function HeroSection() {
  // Social proof counters with realistic growth
  const [companiesOptimized, setCompaniesOptimized] = useState(527);
  const [licensesLeft, setLicensesLeft] = useState(47);
  const [currentViewers, setCurrentViewers] = useState(12);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly increase companies optimized
      if (Math.random() > 0.7) {
        setCompaniesOptimized(prev => prev + 1);
      }
      // Randomly decrease licenses (simulate purchases)
      if (Math.random() > 0.95) {
        setLicensesLeft(prev => Math.max(prev - 1, 15));
      }
      // Fluctuate current viewers
      setCurrentViewers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(8, Math.min(25, prev + change));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { value: '20+', label: 'Metrics Analyzed', suffix: '' },
    { value: '95', label: 'Accuracy', suffix: '%' },
    { value: '5', label: 'Setup Time', suffix: 'min' },
    { value: '30', label: 'Money Back', suffix: ' days' }
  ];

  return (
    <section className="hero relative">
      {/* Background Elements - Static for better performance */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Flash Sale Badge with License Counter */}
          <div className="mb-6 space-y-3">
            <div className="badge badge-primary bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 px-6 py-3 text-lg font-bold animate-pulse">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400 mr-2 animate-ping"></span>
              🔥 ONLY {licensesLeft} LICENSES LEFT AT THIS PRICE
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-muted flex items-center gap-1">
                <span className="inline-flex rounded-full h-2 w-2 bg-green-500 animate-pulse"></span>
                {currentViewers} people viewing now
              </span>
              <span className="text-accent font-semibold">
                {companiesOptimized.toLocaleString()} companies optimized
              </span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-5xl md:text-6xl font-bold">
            Data-Driven SaaS Pricing
            <span className="block mt-2 text-4xl md:text-5xl">
              <span className="gradient-text">That Increases Revenue</span>
            </span>
          </h1>

          {/* Subtitle with Value Proposition */}
          <p className="lead max-w-3xl mx-auto mb-6 text-lg md:text-xl">
            Advanced analytics and competitor insights to optimize your pricing strategy. 
            Get actionable recommendations based on real market data.
          </p>
          
          {/* Value Stack */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <span>💎 $2,497 Value</span>
              <span>•</span>
              <span className="line-through">$299</span>
              <span>•</span>
              <span className="text-accent font-bold text-base">Only $99 Today</span>
              <span>•</span>
              <span>✅ Instant Access</span>
            </div>
          </div>

          {/* Urgency Countdown Timer */}
          <div className="mb-10 max-w-2xl mx-auto">
            <UrgencyCountdown />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/calculator" className="btn btn-primary btn-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Start Free Analysis
            </Link>
            <a 
              href="#demo-video"
              className="btn btn-secondary btn-lg group"
              onClick={(e) => {
                e.preventDefault();
                // Show toast instead of alert for better UX
                import('react-hot-toast').then(({ default: toast }) => {
                  toast('Demo video coming soon! Meanwhile, try the free calculator.', {
                    icon: '🎥',
                    duration: 4000
                  });
                });
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </a>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="stat-card group hover:border-primary/30 transition-colors duration-300"
              >
                <div className="stat-number">
                  {stat.value}<span className="text-2xl">{stat.suffix}</span>
                </div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-20 pt-12 border-t border-subtle">
            <div className="flex items-center justify-center gap-12 flex-wrap">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-muted">SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="text-sm text-muted">support@predictionnexus.com</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-muted">30-Day Money Back</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}