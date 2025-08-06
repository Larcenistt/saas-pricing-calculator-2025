import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const LivePurchaseNotifications = () => {
  const purchaseData = [
    { name: 'Sarah K.', company: 'TechStart', location: 'San Francisco, CA', time: '2 minutes ago' },
    { name: 'Michael R.', company: 'CloudBase', location: 'Austin, TX', time: '5 minutes ago' },
    { name: 'Jennifer L.', company: 'DataFlow', location: 'New York, NY', time: '8 minutes ago' },
    { name: 'David C.', company: 'APIFirst', location: 'Seattle, WA', time: '12 minutes ago' },
    { name: 'Lisa M.', company: 'ScaleUp', location: 'Denver, CO', time: '15 minutes ago' },
    { name: 'Robert P.', company: 'DevOps Pro', location: 'Chicago, IL', time: '18 minutes ago' },
    { name: 'Emily W.', company: 'NextGen SaaS', location: 'Boston, MA', time: '22 minutes ago' },
    { name: 'James H.', company: 'Analytics Plus', location: 'Miami, FL', time: '25 minutes ago' },
    { name: 'Maria G.', company: 'Cloud Solutions', location: 'Portland, OR', time: '28 minutes ago' },
    { name: 'Tom B.', company: 'StartupHub', location: 'Atlanta, GA', time: '32 minutes ago' }
  ];

  useEffect(() => {
    let mounted = true;
    
    // Show first notification after 10 seconds
    const initialDelay = setTimeout(() => {
      if (mounted) {
        showPurchaseNotification(0);
      }
    }, 10000);

    // Then show notifications every 30-60 seconds
    let index = 1;
    const interval = setInterval(() => {
      if (mounted) {
        if (index < purchaseData.length) {
          showPurchaseNotification(index);
          index++;
        } else {
          index = 0; // Loop back to start
        }
      }
    }, Math.random() * 30000 + 30000); // Random between 30-60 seconds

    return () => {
      mounted = false;
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const showPurchaseNotification = (index) => {
    const purchase = purchaseData[index];
    
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-slide-in-right' : 'animate-slide-out-right'
      } bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-sm pointer-events-auto flex items-center gap-3 border border-gray-200 dark:border-gray-700`}>
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {purchase.name} from {purchase.company}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Just purchased • {purchase.location}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {purchase.time}
          </p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ), {
      duration: 5000,
      position: 'bottom-right',
    });
  };

  return null; // This component doesn't render anything directly
};

export default LivePurchaseNotifications;