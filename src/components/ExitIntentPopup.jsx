import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import FlashSaleBuyButton from './FlashSaleBuyButton';

export default function ExitIntentPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if popup has been shown in this session
    const popupShown = sessionStorage.getItem('exitIntentShown');
    if (popupShown) {
      setHasShown(true);
      return;
    }

    let timeout;
    
    const handleMouseLeave = (e) => {
      // Only trigger when mouse leaves from the top
      if (e.clientY <= 0 && !hasShown) {
        // Add a small delay to avoid accidental triggers
        timeout = setTimeout(() => {
          setShowPopup(true);
          setHasShown(true);
          sessionStorage.setItem('exitIntentShown', 'true');
        }, 100);
      }
    };

    const handleMouseEnter = () => {
      // Clear timeout if mouse re-enters
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    // Only add listeners after 10 seconds on page
    const delayTimer = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseLeave);
      document.addEventListener('mouseenter', handleMouseEnter);
    }, 10000);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timeout);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [hasShown]);

  const handleClose = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          
          {/* Popup */}
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl p-8"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Animated background */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-64 h-64 bg-purple-500 rounded-full filter blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-4xl font-bold text-white mb-2">
                    WAIT! Don't Leave Empty-Handed
                  </h2>
                  <p className="text-xl text-gray-300">
                    Get an EXCLUSIVE discount just for you!
                  </p>
                </div>

                {/* Discount Code Box */}
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-xl mb-6 text-center shadow-lg">
                  <p className="text-white text-lg mb-2">Use code at checkout:</p>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 inline-block border-2 border-white/30">
                    <span className="text-3xl font-mono font-bold text-white">SAVE20NOW</span>
                  </div>
                  <p className="text-white text-sm mt-2">Valid for the next 30 minutes only!</p>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">💰</div>
                    <p className="text-sm text-gray-300">Save $20 Instantly</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🚀</div>
                    <p className="text-sm text-gray-300">Instant Access</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm text-gray-300">30-Day Guarantee</p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="max-w-md mx-auto">
                  <FlashSaleBuyButton />
                </div>

                {/* Urgency message */}
                <div className="text-center mt-4">
                  <p className="text-sm text-yellow-400 animate-pulse">
                    ⏰ This exclusive offer expires when you close this window
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}