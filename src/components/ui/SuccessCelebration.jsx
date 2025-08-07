import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function SuccessCelebration({
  isVisible,
  title = '🎉 Success!',
  message = 'Your calculation is complete!',
  onComplete,
  autoHide = true,
  duration = 3000,
  confettiOptions = {}
}) {
  
  useEffect(() => {
    if (isVisible) {
      // Trigger confetti animation
      triggerConfetti(confettiOptions);
      
      // Auto hide after duration
      if (autoHide) {
        const timer = setTimeout(() => {
          onComplete?.();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, autoHide, duration, onComplete, confettiOptions]);

  const triggerConfetti = (options = {}) => {
    const defaults = {
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#1e40af', '#f59e0b', '#34d399', '#60a5fa', '#fbbf24']
    };

    const confettiConfig = { ...defaults, ...options };
    
    // First burst
    confetti(confettiConfig);
    
    // Second burst with delay
    setTimeout(() => {
      confetti({
        ...confettiConfig,
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7 }
      });
    }, 250);
    
    // Third burst with different angle
    setTimeout(() => {
      confetti({
        ...confettiConfig,
        particleCount: 30,
        spread: 50,
        origin: { x: 0.3, y: 0.5 }
      });
    }, 500);
    
    // Fourth burst from other side
    setTimeout(() => {
      confetti({
        ...confettiConfig,
        particleCount: 30,
        spread: 50,
        origin: { x: 0.7, y: 0.5 }
      });
    }, 750);
  };

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 300,
        staggerChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1]
      }
    }
  };

  const childVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-glass-overlay backdrop-blur-sm z-50 
                     flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-glass-surface border border-glass-border rounded-3xl p-8 
                       shadow-premium max-w-md w-full text-center relative overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/10 to-accent-500/10 
                            animate-gradient-x opacity-50" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Success Icon */}
              <motion.div
                className="mb-6 flex justify-center"
                variants={childVariants}
              >
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-success-500 to-primary-600 
                             rounded-full flex items-center justify-center shadow-success"
                  variants={pulseVariants}
                  animate="animate"
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <motion.path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </svg>
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold text-white mb-3"
                variants={childVariants}
              >
                {title}
              </motion.h2>

              {/* Message */}
              <motion.p
                className="text-neutral-300 mb-6"
                variants={childVariants}
              >
                {message}
              </motion.p>

              {/* Floating particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-accent-400 rounded-full opacity-60"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-10, -30, -10],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut'
                    }}
                  />
                ))}
              </div>

              {/* Action Button */}
              {onComplete && (
                <motion.button
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 
                             text-white px-6 py-3 rounded-xl font-semibold 
                             hover:from-primary-500 hover:to-secondary-500 
                             transform transition-all duration-200 hover:scale-105 
                             shadow-glow"
                  variants={childVariants}
                  onClick={onComplete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue
                </motion.button>
              )}
            </div>

            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer-slow opacity-30" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement Toast Component
export function AchievementToast({
  isVisible,
  achievement,
  onComplete,
  duration = 4000
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ 
            type: 'spring',
            damping: 20,
            stiffness: 300
          }}
        >
          <div className="bg-glass-surface border border-glass-border rounded-2xl p-4 
                          shadow-premium backdrop-blur-xl overflow-hidden relative">
            
            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
            
            <div className="flex items-start gap-3">
              {/* Icon */}
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 
                           rounded-xl flex items-center justify-center flex-shrink-0"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.2 }}
              >
                <span className="text-lg">{achievement?.icon || '🏆'}</span>
              </motion.div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <motion.h4
                  className="font-semibold text-white mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {achievement?.title || 'Achievement Unlocked!'}
                </motion.h4>
                <motion.p
                  className="text-sm text-neutral-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {achievement?.description || 'Great job!'}
                </motion.p>
              </div>
              
              {/* Close button */}
              <motion.button
                className="text-neutral-400 hover:text-white transition-colors p-1"
                onClick={onComplete}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}