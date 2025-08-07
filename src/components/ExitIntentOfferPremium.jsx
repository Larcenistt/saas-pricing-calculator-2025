import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';

export default function ExitIntentOfferPremium() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState('professional');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const STORAGE_KEY = 'exit_intent_premium_shown';
  const COOLDOWN_HOURS = 24;

  const offers = {
    starter: {
      original: 99,
      discounted: 79,
      savings: 20,
      percentage: 20,
      name: 'Starter',
      color: 'from-blue-500 to-cyan-500'
    },
    professional: {
      original: 199,
      discounted: 149,
      savings: 50,
      percentage: 25,
      name: 'Professional',
      color: 'from-emerald-500 to-teal-500',
      popular: true
    },
    enterprise: {
      original: 499,
      discounted: 399,
      savings: 100,
      percentage: 20,
      name: 'Enterprise',
      color: 'from-purple-500 to-pink-500'
    }
  };

  useEffect(() => {
    const checkCooldown = () => {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (lastShown) {
        const hoursSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60);
        if (hoursSinceShown < COOLDOWN_HOURS) {
          return false;
        }
      }
      return true;
    };

    const handleMouseLeave = (e) => {
      // Only trigger on actual exit intent (mouse leaving viewport from top)
      if (e.clientY <= 0 && checkCooldown() && !localStorage.getItem('purchase_completed')) {
        setIsVisible(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        trackEvent('exit_intent_shown', { page: window.location.pathname });
      }
    };

    // Also trigger on mobile when user scrolls up quickly (indicates leaving intent)
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      scrollVelocity = lastScrollY - currentScrollY;
      
      // If scrolling up quickly near top of page
      if (scrollVelocity > 50 && currentScrollY < 200 && checkCooldown()) {
        setIsVisible(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        trackEvent('exit_intent_shown_mobile', { method: 'scroll' });
      }
      
      lastScrollY = currentScrollY;
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Track conversion
      trackEvent('exit_intent_conversion', {
        tier: selectedTier,
        discount: offers[selectedTier].percentage,
        savings: offers[selectedTier].savings
      });

      // Store email and offer details
      const leads = JSON.parse(localStorage.getItem('exit_intent_leads') || '[]');
      leads.push({ 
        email, 
        tier: selectedTier,
        offer: `${offers[selectedTier].percentage}% discount`,
        savings: offers[selectedTier].savings,
        date: new Date().toISOString() 
      });
      localStorage.setItem('exit_intent_leads', JSON.stringify(leads));
      
      // Store discount code for checkout
      localStorage.setItem('active_discount', JSON.stringify({
        code: `EXIT${offers[selectedTier].percentage}`,
        tier: selectedTier,
        amount: offers[selectedTier].savings,
        expires: Date.now() + (30 * 60 * 1000) // 30 minutes
      }));

      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      
      // Redirect to pricing with discount applied
      setTimeout(() => {
        setIsVisible(false);
        window.location.href = `#pricing?discount=EXIT${offers[selectedTier].percentage}&tier=${selectedTier}`;
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  const currentOffer = offers[selectedTier];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4"
        onClick={() => setIsVisible(false)}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotateX: -15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.7, opacity: 0, rotateX: 15 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden">
            {/* Animated gradient background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" />
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            </div>
            
            {/* Close button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-black/50 hover:bg-black/70 transition-all hover:scale-110"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative p-8 md:p-12">
              {/* Countdown timer */}
              <div className="absolute top-4 left-4 bg-red-600/20 border border-red-500/50 rounded-full px-3 py-1">
                <span className="text-red-400 text-sm font-mono">
                  ⏰ {formatTime(timeLeft)}
                </span>
              </div>

              {/* Urgency badge */}
              <motion.div 
                className="flex justify-center mb-6"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🔥 EXCLUSIVE ONE-TIME OFFER 🔥
                </div>
              </motion.div>

              {/* Icon with animation */}
              <motion.div 
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-2xl"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-5xl">💎</span>
              </motion.div>

              {/* Heading */}
              <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Wait! Your Success Matters to Us
              </h2>

              <p className="text-center text-gray-300 text-lg mb-8">
                We'd hate to see you leave without optimizing your pricing strategy.
                Here's an exclusive offer just for you:
              </p>

              {/* Tier selection */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {Object.entries(offers).map(([key, offer]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTier(key)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedTier === key 
                        ? 'border-emerald-500 bg-emerald-500/20 scale-105' 
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    {offer.popular && (
                      <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        BEST VALUE
                      </span>
                    )}
                    <h4 className="font-bold text-white mb-1">{offer.name}</h4>
                    <div className="text-2xl font-bold text-emerald-400">{offer.percentage}% OFF</div>
                    <div className="text-sm text-gray-400 line-through">${offer.original}</div>
                    <div className="text-xl font-bold text-white">${offer.discounted}</div>
                    <div className="text-xs text-emerald-400 mt-1">Save ${offer.savings}</div>
                  </button>
                ))}
              </div>

              {/* Current offer display */}
              <div className={`bg-gradient-to-r ${currentOffer.color} p-1 rounded-2xl mb-8`}>
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">You Selected:</p>
                      <p className="text-2xl font-bold text-white">{currentOffer.name} Plan</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-emerald-400">${currentOffer.savings}</p>
                      <p className="text-sm text-gray-400">Total Savings</p>
                    </div>
                  </div>

                  {/* Benefits based on tier */}
                  <ul className="space-y-2">
                    {selectedTier === 'starter' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Core pricing calculator
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> 5 saved calculations
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> PDF exports
                        </li>
                      </>
                    )}
                    {selectedTier === 'professional' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> AI-powered pricing insights
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Unlimited calculations
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Team collaboration (3 seats)
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Excel & Google Sheets export
                        </li>
                      </>
                    )}
                    {selectedTier === 'enterprise' && (
                      <>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Everything in Professional
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> Unlimited team seats
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> White-label reports
                        </li>
                        <li className="flex items-center gap-2 text-gray-300">
                          <span className="text-emerald-400">✓</span> API access & integrations
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to claim this exclusive discount"
                  className="w-full px-6 py-4 bg-black/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                  autoFocus
                />
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-xl shadow-2xl transform transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Unlocking Your Discount...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 text-lg">
                      🎯 Claim ${currentOffer.savings} Discount Now
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" />
                  </svg>
                  Secure Checkout
                </span>
                <span>•</span>
                <span>30-Day Guarantee</span>
                <span>•</span>
                <span>Instant Access</span>
              </div>

              {/* Scarcity text */}
              <p className="text-center text-xs text-red-400 mt-4 animate-pulse">
                ⚠️ This offer won't be shown again • Limited to first 50 customers
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}