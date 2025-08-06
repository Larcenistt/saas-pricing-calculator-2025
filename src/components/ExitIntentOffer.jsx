import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExitIntentOffer() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const STORAGE_KEY = 'exit_intent_shown';
  const COOLDOWN_HOURS = 24;

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
      if (e.clientY <= 0 && checkCooldown() && !localStorage.getItem('purchase_completed')) {
        setIsVisible(true);
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const emails = JSON.parse(localStorage.getItem('exit_intent_emails') || '[]');
      emails.push({ 
        email, 
        offer: '20% discount',
        date: new Date().toISOString() 
      });
      localStorage.setItem('exit_intent_emails', JSON.stringify(emails));
      
      setTimeout(() => {
        setIsVisible(false);
        window.location.href = '/calculator?discount=SAVE20';
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        onClick={() => setIsVisible(false)}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 animate-pulse" />
            
            {/* Close button */}
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative p-8">
              {/* Urgency badge */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce">
                  WAIT! SPECIAL OFFER
                </div>
              </div>

              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 mx-auto mt-4">
                <span className="text-4xl">🎁</span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl font-bold text-white text-center mb-4">
                Don't Leave Empty-Handed!
              </h2>

              {/* Offer */}
              <div className="bg-black/30 rounded-lg p-4 mb-6">
                <p className="text-center text-lg text-white mb-2">
                  Get <span className="text-3xl font-bold text-accent">20% OFF</span>
                </p>
                <p className="text-center text-gray-300">
                  Your exclusive discount - valid for the next 30 minutes only!
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <span className="text-2xl text-gray-400 line-through">$99</span>
                  <span className="text-4xl font-bold text-accent">$79</span>
                  <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">SAVE $20</span>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant access to all features</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>30-day money-back guarantee</span>
                </li>
                <li className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Lifetime updates included</span>
                </li>
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to claim discount"
                  className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/25 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Claim Your 20% Discount →'}
                </button>
              </form>

              {/* Urgency text */}
              <p className="text-center text-xs text-gray-400 mt-4">
                ⏰ Offer expires in 30 minutes • No credit card required
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}