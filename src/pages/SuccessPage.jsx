import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';

export default function SuccessPage() {
  useEffect(() => {
    // Store purchase status
    localStorage.setItem('saas-calculator-purchased', 'true');
    localStorage.setItem('purchase-date', new Date().toISOString());
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <GlassCard className="text-center p-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <span className="text-4xl text-white">✓</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to PriceGenius Pro!
          </h1>
          
          <p className="text-xl text-secondary mb-8">
            Your purchase was successful. Let's optimize your pricing!
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-muted">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Full calculator access unlocked</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All export formats available</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Lifetime updates included</span>
            </div>
          </div>

          <Link to="/calculator">
            <Button className="btn-primary btn-lg">
              Start Optimizing Your Pricing
            </Button>
          </Link>

          <p className="text-sm text-muted mt-6">
            Check your email for your receipt and getting started guide.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}