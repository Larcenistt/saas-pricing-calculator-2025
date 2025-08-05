import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timer);
          return prev;
        }
        return prev + 10;
      });
    }, 100);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <div className="text-center">
        {/* Logo Animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-primary rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-primary rounded-2xl animate-ping"></div>
            <div className="relative z-10 w-full h-full bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Loading Text */}
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          SaaS Pricing Calculator
        </h2>
        <p className="text-muted mb-8">Optimizing your pricing strategy...</p>
        
        {/* Progress Bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Loading Tips */}
        <div className="text-sm text-muted animate-pulse">
          {progress < 30 && "Initializing calculator engine..."}
          {progress >= 30 && progress < 60 && "Loading pricing algorithms..."}
          {progress >= 60 && progress < 90 && "Preparing your dashboard..."}
          {progress >= 90 && "Almost ready..."}
        </div>
      </div>
    </div>
  );
}