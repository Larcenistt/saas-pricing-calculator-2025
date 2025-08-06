import clsx from 'clsx';
import { motion } from 'framer-motion';

const HolographicText = ({ 
  children, 
  variant = 'holographic',
  size = 'md',
  className,
  animate = true,
  glitch = false,
  ...props 
}) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  };

  const variants = {
    holographic: 'holographic',
    neon: 'neon-text',
    metallic: 'metallic-text',
    glitch: 'glitch',
    gradient: 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent',
    chrome: 'bg-gradient-to-b from-gray-100 via-gray-300 to-gray-100 bg-clip-text text-transparent',
    fire: 'bg-gradient-to-t from-orange-600 via-red-500 to-yellow-400 bg-clip-text text-transparent',
    ice: 'bg-gradient-to-b from-blue-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent',
    toxic: 'bg-gradient-to-r from-green-400 via-lime-500 to-yellow-400 bg-clip-text text-transparent',
    sunset: 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent',
  };

  if (glitch) {
    return (
      <span
        className={clsx(
          'relative inline-block font-bold uppercase',
          sizes[size],
          'glitch',
          className
        )}
        data-text={children}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <motion.span
      className={clsx(
        'inline-block font-bold uppercase tracking-wider',
        sizes[size],
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      {...props}
    >
      {children}
    </motion.span>
  );
};

export const NeonHeading = ({ 
  children, 
  level = 1,
  color = 'cyan',
  className,
  ...props 
}) => {
  const Tag = `h${level}`;
  
  const neonColors = {
    cyan: { text: '#00ffff', glow: '0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff' },
    magenta: { text: '#ff00ff', glow: '0 0 20px #ff00ff, 0 0 40px #ff00ff, 0 0 60px #ff00ff' },
    purple: { text: '#9d00ff', glow: '0 0 20px #9d00ff, 0 0 40px #9d00ff, 0 0 60px #9d00ff' },
    green: { text: '#00ff88', glow: '0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 60px #00ff88' },
    orange: { text: '#ff6600', glow: '0 0 20px #ff6600, 0 0 40px #ff6600, 0 0 60px #ff6600' },
    pink: { text: '#ff0084', glow: '0 0 20px #ff0084, 0 0 40px #ff0084, 0 0 60px #ff0084' },
  };

  const currentNeon = neonColors[color] || neonColors.cyan;
  
  const sizeClasses = {
    1: 'text-5xl md:text-6xl lg:text-7xl',
    2: 'text-4xl md:text-5xl lg:text-6xl',
    3: 'text-3xl md:text-4xl lg:text-5xl',
    4: 'text-2xl md:text-3xl lg:text-4xl',
    5: 'text-xl md:text-2xl lg:text-3xl',
    6: 'text-lg md:text-xl lg:text-2xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Tag
        className={clsx(
          'font-black uppercase tracking-wider',
          sizeClasses[level],
          className
        )}
        style={{
          color: currentNeon.text,
          textShadow: currentNeon.glow,
        }}
        {...props}
      >
        {children}
      </Tag>
    </motion.div>
  );
};

export const AnimatedGlitchText = ({ children, className }) => {
  return (
    <motion.div
      className={clsx('relative inline-block', className)}
      animate={{
        x: [0, -2, 2, -1, 1, 0],
      }}
      transition={{
        duration: 0.3,
        repeat: Infinity,
        repeatDelay: 3,
      }}
    >
      <span className="relative z-10 font-bold uppercase">
        {children}
      </span>
      <motion.span
        className="absolute top-0 left-0 font-bold uppercase text-cyan-500"
        style={{ clipPath: 'inset(0 0 60% 0)' }}
        animate={{
          x: [0, 3, 0],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        {children}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 font-bold uppercase text-magenta-500"
        style={{ clipPath: 'inset(40% 0 0 0)' }}
        animate={{
          x: [0, -3, 0],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          repeatDelay: 3,
          delay: 0.05,
        }}
      >
        {children}
      </motion.span>
    </motion.div>
  );
};

export const TypewriterText = ({ text, className, speed = 50 }) => {
  return (
    <motion.div className={clsx('font-mono', className)}>
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: index * (speed / 1000),
          }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        className="inline-block w-2 h-5 bg-cyan-500 ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    </motion.div>
  );
};

export default HolographicText;