import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  glow = false,
  hover = true,
  gradient = false,
  animate = true,
  ...props 
}) {
  // Variant styles using WealthFlow design system
  const variants = {
    default: 'bg-glass-surface border-glass-border',
    primary: 'bg-glass-primary border-primary-500/20',
    secondary: 'bg-glass-secondary border-secondary-500/20', 
    gold: 'bg-glass-tertiary border-accent-500/20',
    success: 'bg-success-500/5 border-success-500/20',
    warning: 'bg-warning-500/5 border-warning-500/20',
    error: 'bg-error-500/5 border-error-500/20'
  };

  // Glow effects
  const glowStyles = {
    default: 'shadow-glow',
    primary: 'shadow-glow',
    secondary: 'shadow-glow-blue', 
    gold: 'shadow-glow-gold',
    success: 'shadow-success',
    warning: 'shadow-warning',
    error: 'shadow-error'
  };

  const baseClasses = clsx(
    // Core glassmorphism styling
    'relative overflow-hidden backdrop-blur-xl rounded-2xl p-6',
    'border border-solid shadow-glass',
    
    // Variant-specific styling
    variants[variant],
    
    // Conditional glow effect
    glow && glowStyles[variant],
    
    // Hover effects
    hover && 'transition-all duration-300 hover:shadow-glass-strong hover:border-glass-border-strong hover:scale-102',
    
    // Gradient overlay
    gradient && 'bg-gradient-to-br from-glass-surface to-glass-primary',
    
    className
  );

  // Animation variants
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { 
      duration: 0.6, 
      ease: [0.16, 1, 0.3, 1],
      type: 'spring',
      damping: 25,
      stiffness: 100
    }
  } : {};

  const Component = animate ? motion.div : 'div';

  return (
    <Component 
      className={baseClasses}
      {...animationProps}
      {...props}
    >
      {/* Shimmer effect overlay */}
      {hover && (
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-shimmer bg-[length:200%_100%] animate-shimmer" />
        </div>
      )}
      
      {/* Gradient border highlight */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-secondary-500/20 to-accent-500/20 opacity-50 blur-sm -z-10" />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </Component>
  );
}