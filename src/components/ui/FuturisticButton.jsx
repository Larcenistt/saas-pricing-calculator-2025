import clsx from 'clsx';
import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';

const FuturisticButton = forwardRef(({ 
  children, 
  variant = 'neon', 
  size = 'md', 
  className,
  ariaLabel,
  disabled = false,
  loading = false,
  icon,
  glowColor = 'cyan',
  onClick,
  ...props 
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now()
    };
    setRipples([...ripples, ripple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 1000);

    onClick?.(e);
  };

  const glowColors = {
    cyan: { primary: '#00ffff', secondary: '#00d4ff' },
    magenta: { primary: '#ff00ff', secondary: '#ff00aa' },
    purple: { primary: '#9d00ff', secondary: '#7700cc' },
    green: { primary: '#00ff88', secondary: '#00cc66' },
    orange: { primary: '#ff6600', secondary: '#ff4400' },
    red: { primary: '#ff0040', secondary: '#cc0033' }
  };

  const currentGlow = glowColors[glowColor] || glowColors.cyan;

  const variants = {
    neon: `
      bg-gradient-to-r from-gray-900/90 to-gray-800/90
      border-2 border-[${currentGlow.primary}]
      text-[${currentGlow.primary}]
      hover:shadow-[0_0_30px_${currentGlow.primary}]
    `,
    chrome: 'bg-gradient-to-br from-gray-300 via-gray-100 to-gray-300 text-gray-900',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
    holographic: 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white',
    matrix: 'bg-black border-2 border-green-500 text-green-500',
    danger: 'bg-gradient-to-r from-red-900 to-red-700 border border-red-500 text-red-100'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm min-h-[36px]',
    md: 'px-6 py-3 text-base min-h-[44px]',
    lg: 'px-8 py-4 text-lg min-h-[52px]',
    xl: 'px-10 py-5 text-xl min-h-[60px]'
  };

  return (
    <motion.button
      ref={ref}
      className={clsx(
        'relative overflow-hidden',
        'font-bold uppercase tracking-wider',
        'rounded-lg transition-all duration-300',
        'transform-gpu perspective-1000',
        sizes[size],
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      style={{
        background: variant === 'neon' ? 
          'linear-gradient(135deg, rgba(15,15,35,0.95), rgba(20,20,40,0.95))' : undefined,
        border: variant === 'neon' ? `2px solid ${currentGlow.primary}` : undefined,
        color: variant === 'neon' ? currentGlow.primary : undefined,
        boxShadow: variant === 'neon' ? 
          `0 0 20px ${currentGlow.primary}40, inset 0 0 20px ${currentGlow.primary}20` : undefined,
        textShadow: variant === 'neon' ? `0 0 10px ${currentGlow.primary}` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ 
        scale: disabled ? 1 : 1.05,
        rotateX: variant === 'holographic' ? 5 : 0,
        rotateY: variant === 'holographic' ? 5 : 0,
      }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 opacity-0"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%)',
        }}
        animate={{
          x: isHovered ? ['0%', '200%'] : '0%',
          opacity: isHovered ? [0, 1, 0] : 0,
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Scanning line */}
      {variant === 'neon' && (
        <motion.div
          className="absolute left-0 top-0 w-full h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${currentGlow.primary}, transparent)`,
          }}
          animate={{
            y: isHovered ? [0, 40, 0] : 0,
            opacity: isHovered ? [0, 1, 0] : 0,
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* Matrix rain effect */}
      {variant === 'matrix' && isHovered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-500 text-xs opacity-70"
              style={{ left: `${20 * i}%` }}
              animate={{
                y: [-20, 60],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              {Math.random().toString(2).substr(2, 8)}
            </motion.div>
          ))}
        </div>
      )}

      {/* Holographic shimmer */}
      {variant === 'holographic' && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            mixBlendMode: 'overlay',
          }}
          animate={{
            x: isHovered ? ['-100%', '100%'] : '-100%',
          }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            background: variant === 'neon' ? currentGlow.primary : 'rgba(255,255,255,0.5)',
          }}
          initial={{ width: 0, height: 0, x: '-50%', y: '-50%', opacity: 0.5 }}
          animate={{ 
            width: 200, 
            height: 200, 
            opacity: 0,
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      ))}

      {/* Chrome reflection */}
      {variant === 'chrome' && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
            transform: 'skewX(-20deg)',
          }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="cyber-loader w-6 h-6" />
        </motion.div>
      )}

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        {children}
      </span>

      {/* Corner accents */}
      {variant === 'neon' && (
        <>
          <div 
            className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
            style={{ borderColor: currentGlow.primary }}
          />
          <div 
            className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2"
            style={{ borderColor: currentGlow.primary }}
          />
          <div 
            className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2"
            style={{ borderColor: currentGlow.primary }}
          />
          <div 
            className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
            style={{ borderColor: currentGlow.primary }}
          />
        </>
      )}
    </motion.button>
  );
});

FuturisticButton.displayName = 'FuturisticButton';

export default FuturisticButton;