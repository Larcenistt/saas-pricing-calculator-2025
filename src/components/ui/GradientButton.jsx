import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GradientButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  glow = false,
  animate = true,
  onClick,
  ...props
}) {
  // WealthFlow button variants
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 hover:from-primary-500 hover:via-primary-400 hover:to-secondary-500 text-white shadow-glow',
    secondary: 'bg-gradient-to-r from-secondary-600 via-secondary-500 to-primary-600 hover:from-secondary-500 hover:via-secondary-400 hover:to-primary-500 text-white shadow-glow-blue',
    gold: 'bg-gradient-to-r from-accent-600 via-accent-500 to-accent-400 hover:from-accent-500 hover:via-accent-400 hover:to-accent-300 text-neutral-900 shadow-glow-gold font-semibold',
    success: 'bg-gradient-to-r from-success-600 via-success-500 to-primary-600 hover:from-success-500 hover:via-success-400 hover:to-primary-500 text-white shadow-success',
    outline: 'bg-glass-surface border-2 border-primary-500/50 hover:border-primary-500 hover:bg-glass-primary text-white backdrop-blur-xl',
    glass: 'bg-glass-surface border border-glass-border hover:border-glass-border-strong hover:bg-glass-primary text-white backdrop-blur-xl shadow-glass',
    ghost: 'bg-transparent hover:bg-glass-surface text-neutral-300 hover:text-white',
  };

  // Size variants
  const sizes = {
    xs: 'px-3 py-1.5 text-xs rounded-lg',
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
    xl: 'px-10 py-5 text-xl rounded-2xl',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const baseClasses = clsx(
    // Core button styling
    'relative inline-flex items-center justify-center font-medium transition-all duration-300',
    'focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:scale-105',
    'active:scale-95 select-none overflow-hidden',
    
    // Size and variant
    sizes[size],
    variants[variant],
    
    // State modifications
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    loading && 'cursor-wait',
    glow && 'animate-glow-pulse',
    
    // Hover effects
    !disabled && 'hover:scale-105 hover:shadow-2xl',
    
    className
  );

  // Animation props
  const animationProps = animate ? {
    whileHover: disabled ? {} : { 
      scale: 1.05,
      boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
    },
    whileTap: disabled ? {} : { scale: 0.95 },
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300
    }
  } : {};

  const Component = animate ? motion.button : 'button';

  return (
    <Component
      className={baseClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...animationProps}
      {...props}
    >
      {/* Background gradient animation */}
      {variant !== 'outline' && variant !== 'glass' && variant !== 'ghost' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        opacity-0 hover:opacity-100 transition-opacity duration-500 
                        animate-shimmer bg-[length:200%_100%]" />
      )}

      {/* Glow effect */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/50 via-secondary-500/50 to-accent-500/50 
                        opacity-0 hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center gap-2">
            <div className={clsx(
              'border-2 border-current border-t-transparent rounded-full animate-spin',
              iconSizes[size]
            )} />
            <span>Loading...</span>
          </div>
        )}

        {/* Normal content */}
        {!loading && (
          <>
            {icon && iconPosition === 'left' && (
              <span className={clsx('flex-shrink-0', iconSizes[size])}>
                {typeof icon === 'string' ? icon : icon}
              </span>
            )}
            
            <span className="flex-1">{children}</span>
            
            {icon && iconPosition === 'right' && (
              <span className={clsx('flex-shrink-0', iconSizes[size])}>
                {typeof icon === 'string' ? icon : icon}
              </span>
            )}
          </>
        )}
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 
                        transition-opacity duration-300 mix-blend-overlay" />
      </div>
    </Component>
  );
}