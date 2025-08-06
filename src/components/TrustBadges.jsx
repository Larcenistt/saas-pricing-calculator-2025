import { motion } from 'framer-motion';

export default function TrustBadges({ variant = 'horizontal' }) {
  const badges = [
    {
      icon: '🔒',
      title: '256-bit SSL',
      description: 'Bank-Level Security'
    },
    {
      icon: '💰',
      title: '30-Day Guarantee',
      description: '100% Money Back'
    },
    {
      icon: '⚡',
      title: 'Instant Access',
      description: 'Download Immediately'
    },
    {
      icon: '🛡️',
      title: 'Stripe Verified',
      description: 'Secure Payments'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-center gap-6 flex-wrap">
        {badges.map((badge, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 text-sm"
          >
            <span className="text-lg">{badge.icon}</span>
            <span className="text-gray-400">{badge.title}</span>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          className="text-center"
        >
          <div className="glass rounded-xl p-4 border border-white/10 hover:border-primary/30 transition-all">
            <div className="text-3xl mb-2">{badge.icon}</div>
            <h4 className="text-white font-semibold text-sm mb-1">{badge.title}</h4>
            <p className="text-gray-500 text-xs">{badge.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}