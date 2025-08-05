import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Back online! Your connection has been restored.', {
          icon: '🌐',
          duration: 3000
        });
        setWasOffline(false);
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('You appear to be offline. Some features may not work.', {
        icon: '📡',
        duration: 5000
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);
  
  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-warning/10 backdrop-blur-md border-t border-warning/20 p-3 z-50">
        <div className="container mx-auto flex items-center justify-center gap-3 text-warning">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
          <span className="font-medium">No internet connection - Some features may be limited</span>
        </div>
      </div>
    );
  }
  
  return null;
}