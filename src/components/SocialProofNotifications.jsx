import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SocialProofNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  // Realistic purchase data with tier information
  const purchaseData = [
    { name: 'Sarah M.', location: 'San Francisco, CA', tier: 'Professional', amount: 199, company: 'TechStartup Inc', timeAgo: '2 minutes' },
    { name: 'John D.', location: 'New York, NY', tier: 'Enterprise', amount: 499, company: 'Scale Solutions', timeAgo: '5 minutes' },
    { name: 'Emily R.', location: 'Austin, TX', tier: 'Starter', amount: 99, company: 'Bootstrap Labs', timeAgo: '8 minutes' },
    { name: 'Michael K.', location: 'Seattle, WA', tier: 'Professional', amount: 199, company: 'CloudFirst', timeAgo: '12 minutes' },
    { name: 'Lisa T.', location: 'Boston, MA', tier: 'Professional', amount: 199, company: 'DataDrive', timeAgo: '15 minutes' },
    { name: 'David L.', location: 'Chicago, IL', tier: 'Enterprise', amount: 499, company: 'Enterprise Co', timeAgo: '18 minutes' },
    { name: 'Anna S.', location: 'Denver, CO', tier: 'Starter', amount: 99, company: 'StartupXYZ', timeAgo: '22 minutes' },
    { name: 'Robert W.', location: 'Miami, FL', tier: 'Professional', amount: 199, company: 'GrowthLabs', timeAgo: '25 minutes' },
    { name: 'Jessica H.', location: 'Portland, OR', tier: 'Professional', amount: 199, company: 'SaaS Builder', timeAgo: '28 minutes' },
    { name: 'Chris P.', location: 'Phoenix, AZ', tier: 'Starter', amount: 99, company: 'MVP Studio', timeAgo: '32 minutes' }
  ];

  // Activity notifications
  const activityData = [
    { type: 'calculation', user: 'Anonymous', action: 'optimized pricing', result: '+23% revenue increase', icon: '📈' },
    { type: 'viewing', count: 47, action: 'people viewing this page', icon: '👀' },
    { type: 'trial', user: 'Mark T.', action: 'started Professional trial', icon: '🚀' },
    { type: 'download', user: 'Rachel K.', action: 'exported pricing report', icon: '📊' },
    { type: 'team', company: 'TechCorp', action: 'invited 3 team members', icon: '👥' },
    { type: 'savings', user: 'Tom B.', action: 'saved $2,400/year with new pricing', icon: '💰' },
    { type: 'comparison', count: 23, action: 'companies compared pricing today', icon: '🔍' },
    { type: 'milestone', message: '500+ companies optimized pricing this month', icon: '🎉' }
  ];

  // Combine purchase and activity notifications
  const allNotifications = [
    ...purchaseData.map(p => ({ ...p, type: 'purchase' })),
    ...activityData.map(a => ({ ...a, type: a.type }))
  ];

  useEffect(() => {
    // Don't show on mobile to avoid cluttering
    if (window.innerWidth < 768) return;

    // Check if user has disabled notifications
    const disabled = localStorage.getItem('social_proof_disabled');
    if (disabled === 'true') return;

    // Shuffle notifications for variety
    const shuffled = [...allNotifications].sort(() => Math.random() - 0.5);
    setNotifications(shuffled);

    // Start showing notifications after a delay
    const initialDelay = setTimeout(() => {
      showNextNotification();
    }, 5000); // Wait 5 seconds before first notification

    return () => clearTimeout(initialDelay);
  }, []);

  const showNextNotification = () => {
    if (notifications.length === 0) return;

    const next = notifications[Math.floor(Math.random() * notifications.length)];
    setCurrentNotification(next);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setCurrentNotification(null);
      
      // Show next notification after a random interval
      const nextDelay = Math.random() * 15000 + 10000; // 10-25 seconds
      setTimeout(showNextNotification, nextDelay);
    }, 5000);
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case 'Enterprise': return 'from-purple-500 to-pink-500';
      case 'Professional': return 'from-emerald-500 to-teal-500';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const renderNotification = (notification) => {
    if (notification.type === 'purchase') {
      return (
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {notification.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold">
              {notification.name} from {notification.company}
            </p>
            <p className="text-gray-300 text-sm">
              Just purchased <span className={`font-bold bg-gradient-to-r ${getTierColor(notification.tier)} bg-clip-text text-transparent`}>
                {notification.tier}
              </span> • {notification.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-emerald-400 font-bold">${notification.amount}</p>
            <p className="text-gray-400 text-xs">{notification.timeAgo} ago</p>
          </div>
        </div>
      );
    } else if (notification.type === 'viewing') {
      return (
        <div className="flex items-center gap-4">
          <div className="text-3xl">{notification.icon}</div>
          <div>
            <p className="text-white font-semibold">
              <span className="text-yellow-400">{notification.count}</span> {notification.action}
            </p>
            <p className="text-gray-300 text-sm">Right now</p>
          </div>
        </div>
      );
    } else if (notification.type === 'savings') {
      return (
        <div className="flex items-center gap-4">
          <div className="text-3xl">{notification.icon}</div>
          <div>
            <p className="text-white font-semibold">{notification.user} {notification.action}</p>
            <p className="text-emerald-400 text-sm font-bold">Optimized pricing strategy</p>
          </div>
        </div>
      );
    } else if (notification.type === 'milestone') {
      return (
        <div className="flex items-center gap-4">
          <div className="text-3xl animate-bounce">{notification.icon}</div>
          <div>
            <p className="text-white font-semibold">{notification.message}</p>
            <p className="text-gray-300 text-sm">Join them today!</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-4">
          <div className="text-3xl">{notification.icon}</div>
          <div>
            <p className="text-white font-semibold">
              {notification.user || `${notification.count} companies`} {notification.action}
            </p>
            {notification.result && (
              <p className="text-emerald-400 text-sm">{notification.result}</p>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      {currentNotification && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-6 z-50 max-w-md"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-xl" />
            
            {/* Main notification */}
            <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 backdrop-blur-xl rounded-xl border border-gray-700 shadow-2xl p-4">
              {/* Close button */}
              <button
                onClick={() => setCurrentNotification(null)}
                className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Verified badge */}
              <div className="absolute -top-2 -left-2">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                  VERIFIED
                </div>
              </div>

              {renderNotification(currentNotification)}

              {/* Progress bar for auto-hide */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b-xl overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Companion component for showing active users count
export function ActiveUsersIndicator() {
  const [activeUsers, setActiveUsers] = useState(234);

  useEffect(() => {
    // Simulate active users fluctuation
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 10) - 5;
        const newValue = prev + change;
        return Math.max(150, Math.min(350, newValue)); // Keep between 150-350
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-40"
    >
      <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-full px-4 py-2 flex items-center gap-3">
        <div className="relative">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-white text-sm font-medium">
          <span className="text-emerald-400 font-bold">{activeUsers}</span> active users now
        </span>
      </div>
    </motion.div>
  );
}