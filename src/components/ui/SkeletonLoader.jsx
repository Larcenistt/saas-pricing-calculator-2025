import clsx from 'clsx';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ 
  variant = 'text', 
  width, 
  height, 
  className,
  count = 1,
  animate = true 
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    button: 'h-11 rounded-lg',
    card: 'h-32 rounded-xl',
    chart: 'h-64 rounded-xl',
    input: 'h-12 rounded-lg',
    avatar: 'h-12 w-12 rounded-full',
    thumbnail: 'h-24 w-24 rounded-lg'
  };

  const shimmer = {
    initial: { backgroundPosition: '-200% 0' },
    animate: { 
      backgroundPosition: '200% 0',
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear'
      }
    }
  };

  const renderSkeleton = () => (
    <motion.div
      className={clsx(
        'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800',
        'bg-[length:200%_100%]',
        variants[variant],
        className
      )}
      style={{ 
        width: width || '100%', 
        height: height || undefined 
      }}
      initial={animate ? shimmer.initial : undefined}
      animate={animate ? shimmer.animate : undefined}
      aria-hidden="true"
    />
  );

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

// Composite skeleton components for common patterns
export const SkeletonCard = ({ showActions = true }) => (
  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 space-y-4">
    <div className="flex justify-between items-start">
      <SkeletonLoader variant="title" width="60%" />
      {showActions && <SkeletonLoader variant="button" width="80px" />}
    </div>
    <SkeletonLoader variant="text" count={3} />
    <div className="flex gap-4 mt-4">
      <SkeletonLoader variant="button" width="100px" />
      <SkeletonLoader variant="button" width="100px" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6">
    <div className="space-y-4">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLoader key={i} variant="text" width="80%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} variant="text" width="90%" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonChart = () => (
  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6">
    <SkeletonLoader variant="title" width="40%" className="mb-4" />
    <SkeletonLoader variant="chart" />
    <div className="flex justify-center gap-8 mt-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <SkeletonLoader variant="avatar" width="12px" height="12px" />
          <SkeletonLoader variant="text" width="60px" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonForm = ({ fields = 4 }) => (
  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonLoader variant="text" width="30%" />
        <SkeletonLoader variant="input" />
      </div>
    ))}
    <div className="flex justify-end gap-4 mt-6">
      <SkeletonLoader variant="button" width="100px" />
      <SkeletonLoader variant="button" width="120px" />
    </div>
  </div>
);

export const CalculatorSkeleton = () => (
  <div className="space-y-6">
    {/* Progress bar */}
    <div className="flex justify-between items-center mb-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonLoader key={i} variant="avatar" width="40px" height="40px" />
      ))}
    </div>
    <SkeletonLoader variant="text" width="100%" height="8px" className="rounded-full" />
    
    {/* Main content */}
    <div className="grid lg:grid-cols-2 gap-6">
      <SkeletonForm />
      <SkeletonChart />
    </div>
    
    {/* Results tabs */}
    <div className="flex gap-4 mb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonLoader key={i} variant="button" width="120px" />
      ))}
    </div>
    
    {/* Results content */}
    <div className="grid md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} showActions={false} />
      ))}
    </div>
  </div>
);

export default SkeletonLoader;