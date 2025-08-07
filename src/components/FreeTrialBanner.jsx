import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';

export default function FreeTrialBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);
  const [daysLeft, setDaysLeft] = useState(7);
  const [email, setEmail] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    // Check if user has an active trial
    const trialData = localStorage.getItem('trial_data');
    if (trialData) {
      const trial = JSON.parse(trialData);
      const startDate = new Date(trial.startDate);
      const now = new Date();
      const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      const remaining = 7 - daysPassed;
      
      if (remaining > 0) {
        setTrialStatus('active');
        setDaysLeft(remaining);
      } else {
        setTrialStatus('expired');
        setShowBanner(true);
      }
    } else {
      // Show trial offer if user hasn't started one
      const hasSeenOffer = sessionStorage.getItem('trial_offer_seen');
      if (!hasSeenOffer) {
        setTimeout(() => {
          setShowBanner(true);
          sessionStorage.setItem('trial_offer_seen', 'true');
        }, 10000); // Show after 10 seconds
      }
    }
  }, []);

  const startTrial = async () => {
    setIsActivating(true);
    
    try {
      // Track trial start
      trackEvent('trial_started', {
        tier: 'professional',
        duration: 7
      });

      // Save trial data
      const trialData = {
        email,
        tier: 'professional',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        features: [
          'ai_insights',
          'unlimited_calculations',
          'team_collaboration',
          'excel_export',
          'priority_support'
        ]
      };
      
      localStorage.setItem('trial_data', JSON.stringify(trialData));
      localStorage.setItem('user_tier', 'professional_trial');
      
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      
      // Show success message
      setTrialStatus('active');
      setDaysLeft(7);
      
      // Redirect to calculator with trial features enabled
      setTimeout(() => {
        window.location.href = '/calculator?trial=professional';
      }, 2000);
      
    } catch (error) {
      console.error('Error starting trial:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const upgradeToPaid = () => {
    trackEvent('trial_upgrade_clicked', {
      daysLeft,
      tier: 'professional'
    });
    window.location.href = '#pricing?upgrade=professional&discount=TRIAL20';
  };

  if (trialStatus === 'active') {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold">Professional Trial Active</span>
            <span className="text-emerald-200">
              {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
            </span>
          </div>
          <button
            onClick={upgradeToPaid}
            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-bold transition-all"
          >
            Upgrade Now (20% OFF)
          </button>
        </div>
      </motion.div>
    );
  }

  if (trialStatus === 'expired') {
    return (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⏰</span>
            <span className="font-bold">Your trial has expired</span>
          </div>
          <button
            onClick={upgradeToPaid}
            className="bg-white/20 hover:bg-white/30 px-4 py-1 rounded-full text-sm font-bold transition-all animate-pulse"
          >
            Upgrade to Continue (Special Offer)
          </button>
        </div>
      </motion.div>
    );
  }

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4"
        onClick={() => setShowBanner(false)}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 animate-pulse" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative p-8">
              {/* Badge */}
              <div className="flex justify-center mb-4">
                <span className="inline-block bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-sm font-bold px-4 py-1 rounded-full">
                  LIMITED TIME OFFER
                </span>
              </div>

              {/* Icon */}
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-4xl">🚀</span>
              </motion.div>

              {/* Heading */}
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                Try Professional Features
                <span className="block text-2xl mt-2 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                  FREE for 7 Days
                </span>
              </h2>

              <p className="text-center text-gray-300 mb-6">
                No credit card required • Cancel anytime • Full access
              </p>

              {/* Features */}
              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">What's included in your trial:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span>
                    <span>AI-powered pricing insights (100 credits)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span>
                    <span>Unlimited calculations & saves</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span>
                    <span>Team collaboration (3 seats)</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span>
                    <span>Excel & Google Sheets export</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="text-emerald-400">✓</span>
                    <span>Priority email support</span>
                  </div>
                </div>
              </div>

              {/* Value prop */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-lg p-3 mb-6">
                <p className="text-center text-white">
                  <span className="font-bold text-emerald-400">$199 value</span> • 
                  <span className="ml-2">Join 500+ companies optimizing pricing</span>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={(e) => { e.preventDefault(); startTrial(); }} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  required
                  autoFocus
                />
                
                <motion.button
                  type="submit"
                  disabled={isActivating}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg shadow-2xl transform transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isActivating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Activating Your Trial...
                    </span>
                  ) : (
                    'Start My Free Trial →'
                  )}
                </motion.button>
              </form>

              {/* Trust text */}
              <p className="text-center text-xs text-gray-400 mt-4">
                After 7 days, upgrade to Professional for $199 (or get 20% off with trial discount)
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}