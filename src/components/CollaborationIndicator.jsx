import { motion, AnimatePresence } from 'framer-motion';

export default function CollaborationIndicator({ collaborators, typingUsers }) {
  if (!collaborators || collaborators.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-glass-primary backdrop-blur-xl rounded-lg p-4 min-w-[200px] border border-white/10"
      >
        <h3 className="text-sm font-semibold mb-3 text-primary">
          Active Collaborators ({collaborators.length})
        </h3>
        
        <div className="space-y-2">
          <AnimatePresence>
            {collaborators.map((user) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2"
              >
                {/* User Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                  
                  {/* Typing indicator */}
                  {typingUsers?.includes(user.userId) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1"
                    >
                      <div className="flex space-x-0.5 bg-gray-800 rounded-full px-1.5 py-0.5">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">
                    {user.email}
                  </p>
                  {typingUsers?.includes(user.userId) && (
                    <p className="text-xs text-muted">typing...</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Cursor component for showing other users' cursors
export function CollaborativeCursor({ cursor, color = '#3B82F6' }) {
  if (!cursor) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute pointer-events-none z-50"
      style={{
        left: cursor.x,
        top: cursor.y
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {cursor.email}
      </div>
    </motion.div>
  );
}