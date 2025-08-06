import clsx from 'clsx';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const CyberCard = ({ 
  children, 
  className,
  variant = 'glass',
  glowColor = 'cyan',
  showScanline = true,
  showCorners = true,
  interactive = true,
  dataStream = false,
  matrixBg = false,
  ...props 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['2deg', '-2deg']);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-2deg', '2deg']);

  const glowColors = {
    cyan: { primary: '#00ffff', secondary: '#00d4ff', tertiary: '#0099cc' },
    magenta: { primary: '#ff00ff', secondary: '#ff00aa', tertiary: '#cc0088' },
    purple: { primary: '#9d00ff', secondary: '#7700cc', tertiary: '#5500aa' },
    green: { primary: '#00ff88', secondary: '#00cc66', tertiary: '#00aa55' },
    orange: { primary: '#ff6600', secondary: '#ff4400', tertiary: '#cc3300' },
    red: { primary: '#ff0040', secondary: '#cc0033', tertiary: '#990026' }
  };

  const currentGlow = glowColors[glowColor] || glowColors.cyan;

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const variants = {
    glass: {
      background: 'linear-gradient(135deg, rgba(0,20,40,0.7), rgba(20,0,40,0.7))',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${currentGlow.primary}30`,
    },
    solid: {
      background: 'linear-gradient(135deg, #0a0a1f, #141428)',
      border: `2px solid ${currentGlow.primary}`,
    },
    holographic: {
      background: 'linear-gradient(135deg, rgba(157,0,255,0.1), rgba(0,255,255,0.1), rgba(255,0,255,0.1))',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
    },
    matrix: {
      background: 'linear-gradient(135deg, rgba(0,20,0,0.95), rgba(0,0,0,0.95))',
      border: '2px solid #00ff00',
    }
  };

  const cardStyle = variants[variant] || variants.glass;

  return (
    <motion.div
      className={clsx(
        'relative overflow-hidden rounded-2xl',
        'transition-all duration-300',
        className
      )}
      style={{
        ...cardStyle,
        boxShadow: isHovered 
          ? `0 20px 60px ${currentGlow.primary}40, inset 0 0 40px ${currentGlow.primary}10`
          : `0 10px 40px ${currentGlow.primary}20, inset 0 0 20px ${currentGlow.primary}05`,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      animate={{
        rotateX: interactive ? rotateX : 0,
        rotateY: interactive ? rotateY : 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      whileHover={interactive ? { scale: 1.02 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {/* Matrix background pattern */}
      {matrixBg && (
        <div className="absolute inset-0 opacity-10">
          <div className="matrix-rain" />
        </div>
      )}

      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `linear-gradient(135deg, ${currentGlow.primary}, ${currentGlow.secondary}, ${currentGlow.tertiary})`,
          filter: 'blur(40px)',
        }}
        animate={{
          scale: isHovered ? [1, 1.2, 1] : 1,
          rotate: isHovered ? [0, 5, 0] : 0,
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Scanning line effect */}
      {showScanline && (
        <motion.div
          className="absolute left-0 w-full h-0.5 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${currentGlow.primary}, transparent)`,
            boxShadow: `0 0 10px ${currentGlow.primary}`,
          }}
          animate={{
            y: [-10, 300, -10],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Data stream effect */}
      {dataStream && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute top-0 w-1"
              style={{
                left: `${30 + i * 20}%`,
                height: '100%',
                background: `linear-gradient(to bottom, transparent, ${currentGlow.primary}40, transparent)`,
              }}
              animate={{
                y: ['-100%', '100%'],
              }}
              transition={{
                duration: 2 + i,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Holographic shimmer */}
      {variant === 'holographic' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
            mixBlendMode: 'overlay',
          }}
          animate={{
            x: ['-200%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Corner accents */}
      {showCorners && (
        <>
          <div 
            className="absolute top-0 left-0 w-6 h-6"
            style={{
              borderTop: `2px solid ${currentGlow.primary}`,
              borderLeft: `2px solid ${currentGlow.primary}`,
            }}
          />
          <div 
            className="absolute top-0 right-0 w-6 h-6"
            style={{
              borderTop: `2px solid ${currentGlow.primary}`,
              borderRight: `2px solid ${currentGlow.primary}`,
            }}
          />
          <div 
            className="absolute bottom-0 left-0 w-6 h-6"
            style={{
              borderBottom: `2px solid ${currentGlow.primary}`,
              borderLeft: `2px solid ${currentGlow.primary}`,
            }}
          />
          <div 
            className="absolute bottom-0 right-0 w-6 h-6"
            style={{
              borderBottom: `2px solid ${currentGlow.primary}`,
              borderRight: `2px solid ${currentGlow.primary}`,
            }}
          />
        </>
      )}

      {/* Glitch effect on hover */}
      {isHovered && variant !== 'holographic' && (
        <>
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: cardStyle.background,
              opacity: 0.5,
              mixBlendMode: 'screen',
            }}
            animate={{
              x: [0, -2, 2, 0],
              y: [0, 2, -2, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: 3,
            }}
          />
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: cardStyle.background,
              opacity: 0.3,
              mixBlendMode: 'multiply',
            }}
            animate={{
              x: [0, 2, -2, 0],
              y: [0, -2, 2, 0],
            }}
            transition={{
              duration: 0.2,
              repeat: 3,
              delay: 0.1,
            }}
          />
        </>
      )}

      {/* Content with padding */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Bottom glow line */}
      <div 
        className="absolute bottom-0 left-4 right-4 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${currentGlow.primary}, transparent)`,
          boxShadow: `0 0 10px ${currentGlow.primary}`,
        }}
      />
    </motion.div>
  );
};

export default CyberCard;