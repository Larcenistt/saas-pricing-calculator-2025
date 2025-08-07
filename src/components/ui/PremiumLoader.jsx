import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function PremiumLoader({
  size = 'md',
  variant = 'default',
  message = 'Loading...',
  showMessage = true,
  progress = null,
  className,
  ...props
}) {
  // Size variants
  const sizes = {
    xs: { 
      container: 'w-8 h-8',
      spinner: 'w-6 h-6 border-2',
      text: 'text-xs mt-2'
    },
    sm: { 
      container: 'w-12 h-12',
      spinner: 'w-10 h-10 border-2',
      text: 'text-sm mt-3'
    },
    md: { 
      container: 'w-16 h-16',
      spinner: 'w-14 h-14 border-3',
      text: 'text-base mt-4'
    },
    lg: { 
      container: 'w-24 h-24',
      spinner: 'w-20 h-20 border-4',
      text: 'text-lg mt-4'
    },
    xl: { 
      container: 'w-32 h-32',
      spinner: 'w-28 h-28 border-4',
      text: 'text-xl mt-6'
    }
  };

  // Variant styles
  const variants = {
    default: {
      spinner: 'border-primary-500/30 border-t-primary-500',
      glow: 'shadow-glow'
    },
    gold: {
      spinner: 'border-accent-500/30 border-t-accent-500',
      glow: 'shadow-glow-gold'
    },
    blue: {
      spinner: 'border-secondary-500/30 border-t-secondary-500', 
      glow: 'shadow-glow-blue'
    },
    glass: {
      spinner: 'border-glass-border border-t-primary-500',
      glow: 'shadow-glass'
    }
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  // Animation variants for different loader types
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }
    }
  };

  const orbitalVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)} {...props}>
      {/* Main loader container */}
      <div className={clsx('relative flex items-center justify-center', sizeConfig.container)}>
        
        {/* Spinning ring loader */}
        <motion.div
          className={clsx(
            'rounded-full',
            sizeConfig.spinner,
            variantConfig.spinner,
            variantConfig.glow
          )}
          variants={spinnerVariants}
          animate="animate"
        />

        {/* Inner pulsing core */}
        <motion.div
          className={clsx(
            'absolute inset-4 rounded-full',
            'bg-gradient-to-br from-primary-500/20 via-secondary-500/20 to-accent-500/20',
            'backdrop-blur-sm'
          )}
          variants={pulseVariants}
          animate="animate"
        />

        {/* Orbital elements */}
        <motion.div
          className="absolute inset-0"
          variants={orbitalVariants}
          animate="animate"
        >
          <div className="relative w-full h-full">
            <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 
                            bg-primary-500 rounded-full opacity-70" />
            <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 -translate-x-1/2 translate-y-1/2 
                            bg-accent-500 rounded-full opacity-50" />
          </div>
        </motion.div>

        {/* Progress indicator */}
        {progress !== null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono text-white/80">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>

      {/* Loading message */}
      {showMessage && (
        <motion.div
          className={clsx(
            'text-center text-neutral-300 font-medium',
            sizeConfig.text
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {message}
          
          {/* Animated dots */}
          <motion.span
            animate={{
              opacity: [0, 1, 0],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                times: [0, 0.5, 1]
              }
            }}
          >
            .
          </motion.span>
          <motion.span
            animate={{
              opacity: [0, 1, 0],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                times: [0, 0.5, 1],
                delay: 0.2
              }
            }}
          >
            .
          </motion.span>
          <motion.span
            animate={{
              opacity: [0, 1, 0],
              transition: {
                duration: 1.5,
                repeat: Infinity,
                times: [0, 0.5, 1],
                delay: 0.4
              }
            }}
          >
            .
          </motion.span>
        </motion.div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="w-32 h-1 bg-glass-border rounded-full mt-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      )}
    </div>
  );
}

// Skeleton Loader Component
export function SkeletonLoader({ 
  className, 
  variant = 'rectangle', 
  animate = true,
  ...props 
}) {
  const variants = {
    rectangle: 'rounded-xl',
    circle: 'rounded-full aspect-square',
    text: 'rounded-lg h-4',
    button: 'rounded-2xl h-12'
  };

  const shimmerAnimation = {
    animate: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      }
    }
  };

  return (
    <motion.div
      className={clsx(
        'bg-glass-surface bg-gradient-to-r from-glass-surface via-glass-border to-glass-surface',
        'bg-[length:400%_100%]',
        variants[variant],
        className
      )}
      variants={animate ? shimmerAnimation : {}}
      animate={animate ? 'animate' : ''}
      {...props}
    />
  );
}

// Loading Overlay Component
export function LoadingOverlay({ isVisible, message = 'Processing...', variant = 'default' }) {
  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-glass-overlay backdrop-blur-sm z-50 
                 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-glass-surface border border-glass-border rounded-3xl p-8 
                   shadow-premium max-w-sm w-full mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: 'spring',
          damping: 20,
          stiffness: 300
        }}
      >
        <PremiumLoader size="lg" variant={variant} message={message} />
      </motion.div>
    </motion.div>
  );
}