import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UrgencyBanner() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if user has dismissed banner
    const dismissed = localStorage.getItem('urgency_banner_dismissed');
    const dismissedTime = localStorage.getItem('urgency_banner_dismissed_time');
    
    if (dismissed && dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setIsVisible(false);
        return;
      }
    }

    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 24 hours when timer reaches 0
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('urgency_banner_dismissed', 'true');
    localStorage.setItem('urgency_banner_dismissed_time', Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white">
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>

          <div className="container relative z-10">
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-4 flex-1">
                {/* Fire emoji animation */}
                <motion.span 
                  className="text-2xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🔥
                </motion.span>

                <div className="flex items-center gap-6 flex-wrap">
                  <span className="font-bold text-sm md:text-base">
                    LIMITED TIME: 67% OFF All Plans!
                  </span>

                  {/* Countdown Timer */}
                  <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full">
                    <span className="text-xs md:text-sm font-mono">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-xs md:text-sm animate-pulse">:</span>
                    <span className="text-xs md:text-sm font-mono">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-xs md:text-sm animate-pulse">:</span>
                    <span className="text-xs md:text-sm font-mono">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Savings amount */}
                  <span className="hidden md:inline-block text-sm">
                    Save up to $1,500 on Enterprise
                  </span>

                  {/* CTA */}
                  <motion.a
                    href="#pricing"
                    className="inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs md:text-sm font-semibold transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Claim Offer
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.a>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Dismiss banner"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-red-800">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 86400, ease: 'linear' }} // 24 hours
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}