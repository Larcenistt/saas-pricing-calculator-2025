import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import Button from './ui/Button';
import { createPortal } from 'react-dom';

const OnboardingTutorial = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to SaaS Pricing Calculator! 🎉',
      content: 'Get data-driven pricing recommendations in just 3 minutes. Let me show you how.',
      target: null,
      position: 'center',
      icon: '👋'
    },
    {
      id: 'basic-inputs',
      title: 'Start with Basic Information',
      content: 'Enter your current price, customer count, and churn rate. These are the minimum requirements to get started.',
      target: '.calculator-basics',
      position: 'right',
      icon: '📊'
    },
    {
      id: 'advanced-metrics',
      title: 'Add Advanced Metrics (Optional)',
      content: 'For more accurate projections, add your CAC, contract length, and expansion revenue. You can skip these if you don\'t have the data.',
      target: '.calculator-advanced',
      position: 'right',
      icon: '🚀'
    },
    {
      id: 'results',
      title: 'Get Instant Results',
      content: 'See your optimal pricing, revenue projections, and key SaaS metrics. Switch between different views using the tabs.',
      target: '.results-section',
      position: 'top',
      icon: '📈'
    },
    {
      id: 'export',
      title: 'Export Your Analysis',
      content: 'Download a professional PDF report or share your results with your team. Perfect for board meetings!',
      target: '.export-buttons',
      position: 'left',
      icon: '📄'
    },
    {
      id: 'shortcuts',
      title: 'Pro Tips & Shortcuts',
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl + Enter</kbd>
            <span>Calculate instantly</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Ctrl + E</kbd>
            <span>Export to PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">←→</kbd>
            <span>Navigate tabs</span>
          </div>
        </div>
      ),
      target: null,
      position: 'center',
      icon: '⌨️'
    }
  ];

  useEffect(() => {
    // Check if user has seen tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (hasSeenTutorial) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    // Add keyboard navigation
    const handleKeyPress = (e) => {
      if (!isVisible) return;

      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  if (!isVisible) {
    return (
      <button
        onClick={handleRestart}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        aria-label="Restart tutorial"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'fixed z-50',
              currentStepData.position === 'center' && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              currentStepData.position === 'top' && 'top-20 left-1/2 -translate-x-1/2',
              currentStepData.position === 'right' && 'top-1/2 right-8 -translate-y-1/2',
              currentStepData.position === 'bottom' && 'bottom-20 left-1/2 -translate-x-1/2',
              currentStepData.position === 'left' && 'top-1/2 left-8 -translate-y-1/2'
            )}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700 p-6 max-w-md mx-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentStepData.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{currentStepData.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">Step {currentStep + 1} of {steps.length}</p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                  aria-label="Skip tutorial"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="text-gray-300 mb-6">
                {typeof currentStepData.content === 'string' ? (
                  <p>{currentStepData.content}</p>
                ) : (
                  currentStepData.content
                )}
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Skip tour
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Step dots */}
                  <div className="flex gap-1 mr-4">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentStep(index)}
                        className={clsx(
                          'w-2 h-2 rounded-full transition-all',
                          index === currentStep ? 'bg-blue-500 w-6' : 'bg-gray-600 hover:bg-gray-500'
                        )}
                        aria-label={`Go to step ${index + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="glass"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    ariaLabel="Previous step"
                  >
                    ←
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleNext}
                    ariaLabel={currentStep === steps.length - 1 ? 'Complete tutorial' : 'Next step'}
                  >
                    {currentStep === steps.length - 1 ? 'Get Started' : 'Next →'}
                  </Button>
                </div>
              </div>

              {/* Keyboard hints */}
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-center gap-4">
                <span>←→ Navigate</span>
                <span>ESC Skip</span>
                <span>ENTER Next</span>
              </div>
            </div>

            {/* Pointing arrow for targeted elements */}
            {currentStepData.target && (
              <div 
                className={clsx(
                  'absolute w-0 h-0',
                  currentStepData.position === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
                  currentStepData.position === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
                  currentStepData.position === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
                  currentStepData.position === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2'
                )}
                style={{
                  borderLeft: currentStepData.position === 'right' ? '12px solid #1f2937' : '0',
                  borderRight: currentStepData.position === 'left' ? '12px solid #1f2937' : '0',
                  borderTop: currentStepData.position === 'bottom' ? '12px solid #1f2937' : '0',
                  borderBottom: currentStepData.position === 'top' ? '12px solid #1f2937' : '0',
                  borderLeftColor: currentStepData.position === 'right' ? '#1f2937' : 'transparent',
                  borderRightColor: currentStepData.position === 'left' ? '#1f2937' : 'transparent',
                  borderTopColor: currentStepData.position === 'bottom' ? '#1f2937' : 'transparent',
                  borderBottomColor: currentStepData.position === 'top' ? '#1f2937' : 'transparent',
                  borderTopWidth: currentStepData.position === 'right' || currentStepData.position === 'left' ? '12px' : undefined,
                  borderBottomWidth: currentStepData.position === 'right' || currentStepData.position === 'left' ? '12px' : undefined,
                  borderLeftWidth: currentStepData.position === 'top' || currentStepData.position === 'bottom' ? '12px' : undefined,
                  borderRightWidth: currentStepData.position === 'top' || currentStepData.position === 'bottom' ? '12px' : undefined,
                }}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document root
  return createPortal(tooltipContent, document.body);
};

export default OnboardingTutorial;