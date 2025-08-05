import clsx from 'clsx';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading = false,
  ...props 
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger'
  };

  const sizes = {
    sm: 'text-sm py-2 px-4',
    md: 'text-base py-2.5 px-6',
    lg: 'text-lg py-3 px-8'
  };

  return (
    <button
      className={clsx(
        'btn font-medium transition-all duration-200',
        variants[variant],
        sizes[size],
        isLoading && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      <span className={clsx('flex items-center justify-center gap-2', isLoading && 'invisible')}>
        {children}
      </span>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}