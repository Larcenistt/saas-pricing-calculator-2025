import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import GradientButton from './GradientButton';

export default function GlassNavigation({
  logo,
  logoText = 'WealthFlow',
  menuItems = [],
  actions = [],
  className,
  fixed = true,
  transparent = false,
  ...props
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    if (fixed) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [fixed]);

  const navClasses = clsx(
    // Base styles
    'w-full transition-all duration-500 ease-in-out z-50',
    
    // Fixed positioning
    fixed && 'fixed top-0 left-0 right-0',
    
    // Glass effect - enhanced when scrolled
    'backdrop-blur-xl',
    isScrolled || !transparent ? 
      'bg-glass-surface border-b border-glass-border shadow-glass' : 
      'bg-transparent',
    
    className
  );

  // Menu animation variants
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1]
      }
    }
  };

  const menuItemVariants = {
    closed: { 
      x: -20, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    open: (i) => ({
      x: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: [0.4, 0.0, 0.2, 1]
      }
    })
  };

  return (
    <motion.nav
      className={navClasses}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ 
        type: 'spring',
        damping: 20,
        stiffness: 300,
        delay: 0.1
      }}
      {...props}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo Section */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {logo && (
              <div className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0">
                {typeof logo === 'string' ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                ) : logo}
              </div>
            )}
            
            <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              {logoText}
            </span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {menuItems.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={clsx(
                  'px-4 py-2 rounded-xl font-medium transition-all duration-200',
                  'hover:bg-glass-primary hover:text-white text-neutral-300',
                  item.active && 'bg-glass-primary text-white shadow-glow'
                )}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.label}
              </motion.a>
            ))}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {actions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {action.component || (
                    <GradientButton
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.onClick}
                      href={action.href}
                    >
                      {action.label}
                    </GradientButton>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 rounded-xl bg-glass-surface border border-glass-border
                         hover:bg-glass-primary transition-all duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden border-t border-glass-border"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="px-2 pt-4 pb-6 space-y-2">
                {/* Mobile Menu Items */}
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    className={clsx(
                      'block px-4 py-3 rounded-xl font-medium transition-all duration-200',
                      'hover:bg-glass-primary hover:text-white text-neutral-300',
                      item.active && 'bg-glass-primary text-white shadow-glow'
                    )}
                    custom={index}
                    variants={menuItemVariants}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </motion.a>
                ))}
                
                {/* Mobile Actions */}
                <div className="pt-4 border-t border-glass-border space-y-3">
                  {actions.map((action, index) => (
                    <motion.div
                      key={action.label}
                      custom={menuItems.length + index}
                      variants={menuItemVariants}
                    >
                      {action.component || (
                        <GradientButton
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={() => {
                            action.onClick?.();
                            setIsMobileMenuOpen(false);
                          }}
                          href={action.href}
                          className="w-full justify-center"
                        >
                          {action.label}
                        </GradientButton>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background blur overlay when menu is open */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-glass-overlay backdrop-blur-sm z-[-1] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
}