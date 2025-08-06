import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function PurchaseNotifications() {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Simulate random purchase notifications
    const names = ['John', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'James', 'Anna'];
    const locations = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney', 'Toronto', 'Berlin', 'Singapore'];
    
    const showNotification = () => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      const randomTime = Math.floor(Math.random() * 10) + 1;
      
      const newNotification = {
        id: Date.now(),
        text: `${randomName} from ${randomLocation} just purchased`,
        time: `${randomTime} minutes ago`
      };
      
      setNotifications(prev => [...prev, newNotification]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };
    
    // Show first notification after 5 seconds
    const firstTimer = setTimeout(showNotification, 5000);
    
    // Then show notifications randomly every 15-30 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        showNotification();
      }
    }, 20000);
    
    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, []);
  
  return (
    <div className="fixed bottom-8 left-8 z-50 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 min-w-[300px]"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold">{notification.text}</p>
              <p className="text-xs opacity-90">{notification.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}