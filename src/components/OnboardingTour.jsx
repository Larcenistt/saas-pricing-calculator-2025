import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';

export default function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to SaaS Calculator 2025! 🚀',
      content: 'In the next 2 minutes, discover how to increase your revenue by 47% on average.',
      position: 'center',
      action: 'Start Tour',
      icon: '👋'
    },
    {
      id: 'calculator',
      title: 'AI-Powered Calculator',
      content: 'Enter your current pricing and watch our AI analyze 10,000+ SaaS companies to find your optimal price point.',
      selector: '#calculator-section',
      position: 'bottom',
      highlight: true,
      icon: '🤖'
    },
    {
      id: 'competitors',
      title: 'Competitor Analysis',
      content: 'See how you stack up against similar companies. We analyze pricing, features, and positioning.',
      selector: '#competitor-section',
      position: 'top',
      highlight: true,
      icon: '📊'
    },
    {
      id: 'metrics',
      title: '20+ SaaS Metrics',
      content: 'Track CAC, LTV, MRR growth, churn rate, and more. All calculated automatically.',
      selector: '#metrics-section',
      position: 'right',
      highlight: true,
      icon: '📈'
    },
    {
      id: 'export',
      title: 'Professional Reports',
      content: 'Export beautiful PDF reports to share with your team or investors. Excel export also available.',
      selector: '#export-button',
      position: 'left',
      highlight: true,
      icon: '📄'
    },
    {
      id: 'roi',
      title: 'Your ROI Potential',
      content: 'Most users see a 47x return on investment. That means $4,653 in additional revenue from a $99 investment.',
      position: 'center',
      action: 'Calculate My ROI',
      icon: '💰'
    },
    {
      id: 'offer',
      title: 'Special Offer Today',
      content: 'Get lifetime access for just $99 (normally $199). This price expires in 24 hours.',
      position: 'center',
      action: 'Claim My Discount',
      icon: '🎁',
      final: true
    }
  ];

  useEffect(() => {
    // Check if user has seen tour
    const tourSeen = localStorage.getItem('onboarding_tour_completed');
    const isNewUser = !localStorage.getItem('returning_user');
    
    if (!tourSeen && isNewUser) {
      // Show tour for new users after a delay
      setTimeout(() => {
        setIsActive(true);
        trackEvent('onboarding_tour_started');
      }, 3000);
    }
    
    // Mark as returning user
    localStorage.setItem('returning_user', 'true');
  }, []);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      trackEvent('onboarding_step_completed', {
        step: steps[currentStep].id,
        step_number: currentStep
      });
    } else {
      completeTour();
    }
  };

  const skipTour = () => {
    trackEvent('onboarding_tour_skipped', {
      skipped_at_step: steps[currentStep].id
    });
    setIsActive(false);
    localStorage.setItem('onboarding_tour_completed', 'true');
  };

  const completeTour = () => {
    trackEvent('onboarding_tour_completed');
    setIsActive(false);
    localStorage.setItem('onboarding_tour_completed', 'true');
    
    // Celebrate completion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b']
    });
    
    // Redirect to pricing or show ROI calculator
    if (steps[currentStep].final) {
      setTimeout(() => {
        window.location.href = '#pricing';
      }, 1000);
    }
  };

  const getStepPosition = (step) => {
    if (step.selector && typeof document !== 'undefined') {
      const element = document.querySelector(step.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        return {
          top: rect.top + scrollTop,
          left: rect.left + scrollLeft,
          width: rect.width,
          height: rect.height
        };
      }
    }
    return null;
  };

  const currentStepData = steps[currentStep];
  const stepPosition = getStepPosition(currentStepData);

  if (!isActive) {
    // Show a small button to restart tour
    return (
      <motion.button
        onClick={() => {
          setIsActive(true);
          setCurrentStep(0);
          trackEvent('onboarding_tour_restarted');
        }}
        className="fixed bottom-6 left-6 z-30 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:scale-105 transition-transform"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
      >
        <span>🎯</span>
        <span>Take Tour</span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={skipTour}
          />

          {/* Highlight element if specified */}
          {currentStepData.highlight && stepPosition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-[101] pointer-events-none"
              style={{
                top: stepPosition.top - 8,
                left: stepPosition.left - 8,
                width: stepPosition.width + 16,
                height: stepPosition.height + 16,
                border: '3px solid',
                borderImage: 'linear-gradient(45deg, #10b981, #3b82f6) 1',
                borderRadius: '12px',
                boxShadow: '0 0 40px rgba(16, 185, 129, 0.5)'
              }}
            />
          )}

          {/* Tour tooltip */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className={`fixed z-[102] ${
              currentStepData.position === 'center' 
                ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' 
                : ''
            } ${
              currentStepData.position === 'bottom' && stepPosition
                ? `top-[${stepPosition.top + stepPosition.height + 20}px] left-[${stepPosition.left + stepPosition.width/2}px] transform -translate-x-1/2`
                : ''
            } max-w-md w-full px-4`}
            style={
              currentStepData.position !== 'center' && stepPosition ? {
                top: currentStepData.position === 'bottom' ? stepPosition.top + stepPosition.height + 20 : 
                     currentStepData.position === 'top' ? stepPosition.top - 200 : 
                     stepPosition.top + stepPosition.height/2 - 100,
                left: currentStepData.position === 'left' ? stepPosition.left - 420 :
                      currentStepData.position === 'right' ? stepPosition.left + stepPosition.width + 20 :
                      stepPosition.left + stepPosition.width/2,
                transform: currentStepData.position === 'bottom' || currentStepData.position === 'top' 
                  ? 'translateX(-50%)' 
                  : 'translateY(-50%)'
              } : {}
            }
          >
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 animate-pulse" />
              </div>

              {/* Progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="relative p-6">
                {/* Step counter */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <button
                    onClick={skipTour}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Skip tour
                  </button>
                </div>

                {/* Icon */}
                <motion.div 
                  className="text-5xl mb-4 text-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentStepData.icon}
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 text-center">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-300 text-center mb-6">
                  {currentStepData.content}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                  <motion.button
                    onClick={nextStep}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-lg shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {currentStepData.action || (currentStep === steps.length - 1 ? 'Complete Tour' : 'Next →')}
                  </motion.button>
                </div>

                {/* Tips */}
                {currentStep === 0 && (
                  <p className="text-center text-xs text-gray-400 mt-4">
                    💡 Takes only 2 minutes • See exactly how to use the calculator
                  </p>
                )}
              </div>
            </div>

            {/* Arrow pointing to highlighted element */}
            {currentStepData.highlight && stepPosition && currentStepData.position === 'top' && (
              <div className="absolute bottom-[-20px] left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-gray-900" />
              </div>
            )}
            {currentStepData.highlight && stepPosition && currentStepData.position === 'bottom' && (
              <div className="absolute top-[-20px] left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[20px] border-b-gray-900" />
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}