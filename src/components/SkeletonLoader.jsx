export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-glass-primary backdrop-blur-sm border border-glass-border rounded-xl p-6 animate-pulse">
            <div className="h-12 w-12 bg-bg-elevated rounded-lg mb-4"></div>
            <div className="h-6 bg-bg-elevated rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-bg-elevated rounded w-full mb-2"></div>
            <div className="h-4 bg-bg-elevated rounded w-5/6"></div>
          </div>
        );
      
      case 'testimonial':
        return (
          <div className="bg-glass-primary backdrop-blur-sm border border-glass-border rounded-xl p-6 animate-pulse">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-bg-elevated rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-5 bg-bg-elevated rounded w-32 mb-2"></div>
                <div className="h-4 bg-bg-elevated rounded w-24"></div>
              </div>
            </div>
            <div className="h-4 bg-bg-elevated rounded w-full mb-2"></div>
            <div className="h-4 bg-bg-elevated rounded w-full mb-2"></div>
            <div className="h-4 bg-bg-elevated rounded w-3/4"></div>
          </div>
        );
      
      case 'pricing':
        return (
          <div className="bg-glass-primary backdrop-blur-sm border border-glass-border rounded-xl p-8 animate-pulse">
            <div className="h-6 bg-bg-elevated rounded w-24 mb-4 mx-auto"></div>
            <div className="h-12 bg-bg-elevated rounded w-32 mb-6 mx-auto"></div>
            <div className="space-y-3 mb-6">
              <div className="h-4 bg-bg-elevated rounded w-full"></div>
              <div className="h-4 bg-bg-elevated rounded w-full"></div>
              <div className="h-4 bg-bg-elevated rounded w-full"></div>
            </div>
            <div className="h-12 bg-bg-elevated rounded-lg w-full"></div>
          </div>
        );
      
      case 'text':
        return (
          <div className="animate-pulse">
            <div className="h-4 bg-bg-elevated rounded w-full mb-2"></div>
            <div className="h-4 bg-bg-elevated rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-bg-elevated rounded w-4/6"></div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
}