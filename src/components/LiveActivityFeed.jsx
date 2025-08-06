import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveActivity } from '../hooks/useSocket';
import GlassCard from './ui/GlassCard';

export default function LiveActivityFeed({ compact = false }) {
  const { activities, metrics } = useLiveActivity();
  const [isExpanded, setIsExpanded] = useState(!compact);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'calculation':
        return '🧮';
      case 'subscription':
        return '💳';
      case 'user':
        return '👤';
      default:
        return '📊';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'calculation':
        return 'text-blue-400';
      case 'subscription':
        return 'text-green-400';
      case 'user':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (compact && !isExpanded) {
    return (
      <motion.button
        onClick={() => setIsExpanded(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 left-4 z-40 bg-glass-primary backdrop-blur-xl rounded-full p-4 border border-white/10 shadow-lg"
      >
        <div className="relative">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {activities.length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={compact ? "fixed bottom-4 left-4 z-40 w-80" : "w-full"}
    >
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">🔴</span>
            Live Activity
          </h3>
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Metrics Summary */}
        {metrics && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{metrics.totalCalculations}</p>
              <p className="text-xs text-muted">Calculations</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{metrics.activeUsers}</p>
              <p className="text-xs text-muted">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">${metrics.averagePrice}</p>
              <p className="text-xs text-muted">Avg Price</p>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {activities.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted py-4"
              >
                No recent activity
              </motion.p>
            ) : (
              activities.map((activity, index) => (
                <motion.div
                  key={`${activity.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-xl mt-0.5">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${getActivityColor(activity.type)}`}>
                      {activity.action}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-muted truncate">
                        {activity.details.name || activity.details.email || activity.details.plan}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(activity.timestamp || new Date())}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Connection Status */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Connected
            </span>
            <span className="text-muted">
              {activities.length} events
            </span>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Mini activity ticker for homepage
export function ActivityTicker() {
  const { activities } = useLiveActivity();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activities.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) {
    return null;
  }

  const currentActivity = activities[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-glass-primary backdrop-blur-xl rounded-lg px-4 py-2 border border-white/10"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center space-x-2"
        >
          <span>{getActivityIcon(currentActivity.type)}</span>
          <p className="text-sm text-muted">
            {currentActivity.action}
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  function getActivityIcon(type) {
    switch (type) {
      case 'calculation':
        return '🧮';
      case 'subscription':
        return '💳';
      case 'user':
        return '👤';
      default:
        return '📊';
    }
  }
}