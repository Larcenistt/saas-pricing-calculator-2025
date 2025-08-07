import clsx from 'clsx';
import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className,
  ariaLabel,
  disabled = false,
  loading = false,
  icon,
  ...props 
}, ref) => {
  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-500 hover:to-secondary-500 shadow-glow',
    secondary: 'bg-glass-surface border border-glass-border text-white hover:bg-glass-primary hover:border-glass-border-strong backdrop-blur-xl',
    glass: 'bg-glass-surface backdrop-blur-xl border border-glass-border text-white hover:bg-glass-primary hover:border-glass-border-strong',
    danger: 'bg-gradient-to-r from-error-600 to-error-500 text-white hover:from-error-500 hover:to-error-400',
    success: 'bg-gradient-to-r from-success-600 to-primary-600 text-white hover:from-success-500 hover:to-primary-500 shadow-success'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]'
  };

  return (
    <button
      ref={ref}
      className={clsx(
        'font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900',
        'min-w-[44px] relative inline-flex items-center justify-center gap-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;