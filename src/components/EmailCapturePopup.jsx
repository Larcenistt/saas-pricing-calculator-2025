import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import toast from 'react-hot-toast';
import { trackResourceDownload } from '../utils/analytics';

export default function EmailCapturePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  useEffect(() => {
    // Check if user has already downloaded
    const downloaded = localStorage.getItem('saas_pricing_guide_downloaded');
    if (downloaded) {
      setHasDownloaded(true);
      return;
    }

    // Show popup after 30 seconds or when user scrolls 50%
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercentage > 50 && !hasDownloaded) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(showTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasDownloaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    setIsSubmitting(true);

    // Here you would normally send to your email service
    // For now, we'll simulate it
    try {
      // Store email locally (in production, send to backend)
      const emails = JSON.parse(localStorage.getItem('captured_emails') || '[]');
      emails.push({ email, date: new Date().toISOString() });
      localStorage.setItem('captured_emails', JSON.stringify(emails));
      
      // Mark as downloaded
      localStorage.setItem('saas_pricing_guide_downloaded', 'true');
      setHasDownloaded(true);
      
      // Track download
      trackResourceDownload('SaaS Pricing Mistakes Guide');
      
      // Create and trigger download
      const guideContent = `
# 7 SaaS Pricing Mistakes That Cost You $100K+ Per Year

## Mistake #1: Copying Competitor Prices
**The Problem**: Your value proposition is unique, but your pricing isn't.
**The Fix**: Base pricing on YOUR value, not theirs.
**Impact**: +20-40% revenue potential

## Mistake #2: Having Only One Price Tier
**The Problem**: You're leaving money on the table from enterprise customers.
**The Fix**: Create 3 tiers: Starter, Professional, Enterprise.
**Impact**: +35% average contract value

## Mistake #3: Undervaluing Your Product
**The Problem**: Most SaaS companies are underpriced by 30-40%.
**The Fix**: Test 20-30% price increases with new customers.
**Impact**: Direct revenue increase with minimal churn

## Mistake #4: Ignoring Usage-Based Pricing
**The Problem**: Flat pricing doesn't scale with customer value.
**The Fix**: Add usage-based components to align price with value.
**Impact**: +50% expansion revenue

## Mistake #5: Not Testing Price Changes
**The Problem**: Fear of churn prevents any pricing optimization.
**The Fix**: A/B test with new customers, grandfather existing.
**Impact**: Data-driven pricing confidence

## Mistake #6: Forgetting About Localization
**The Problem**: USD pricing in markets with different purchasing power.
**The Fix**: Implement purchasing power parity pricing.
**Impact**: +25% conversion in international markets

## Mistake #7: No Annual Discount Strategy
**The Problem**: Missing out on upfront cash flow.
**The Fix**: Offer 15-20% discount for annual prepayment.
**Impact**: 2.5x better cash flow

## Your Next Steps:
1. Audit your current pricing against these mistakes
2. Use our SaaS Pricing Calculator for data-driven recommendations
3. Test one change at a time with new customers
4. Measure impact and iterate

---
Ready to optimize your pricing? Try our calculator:
https://predictionnexus.com

© 2025 PredictionNexus. All rights reserved.
`;

      const blob = new Blob([guideContent], { type: 'text/markdown' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SaaS-Pricing-Mistakes-Guide.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Guide sent! Check your downloads.');
      setTimeout(() => setIsVisible(false), 2000);
      
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasDownloaded) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="relative max-w-lg w-full p-8">
              {/* Close button */}
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-glass-secondary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-3">
                  Free Guide: 7 SaaS Pricing Mistakes
                </h3>
                <p className="text-secondary/80">
                  Learn the pricing mistakes that cost SaaS companies $100K+ per year and how to fix them.
                </p>
              </div>

              {/* Benefits */}
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-secondary/80">Discover if you're underpriced by 30-40%</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-secondary/80">Learn the perfect 3-tier pricing structure</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-secondary/80">Get actionable steps to increase revenue 47%</span>
                </li>
              </ul>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input w-full"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Get Free Guide'}
                </Button>
              </form>

              <p className="text-xs text-secondary/50 text-center mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}