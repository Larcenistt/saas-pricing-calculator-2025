import { useEffect, useState } from 'react';
import Calculator from './Calculator';

export default function Success() {
  const [showConfetti, setShowConfetti] = useState(true);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // Mark as purchased in localStorage
    localStorage.setItem('purchased', 'true');
    localStorage.setItem('purchaseDate', new Date().toISOString());
    
    // Get session ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session_id');
    if (session) {
      setSessionId(session);
      localStorage.setItem('stripeSessionId', session);
    }
    
    // Hide confetti after 3 seconds
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  return (
    <div className="min-h-screen premium-bg text-white">
      {/* Success Banner */}
      <div className="bg-green-900 bg-opacity-20 border-b border-green-500 border-opacity-30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-green-400 font-medium">
              Payment successful! Your purchase has been confirmed.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          {showConfetti && (
            <div className="text-6xl mb-4 animate-bounce">
              🎉
            </div>
          )}
          <h1 className="text-4xl font-bold mb-4 premium-title">
            Welcome to Your Pricing Calculator!
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Thank you for your purchase. Your calculator is ready to use immediately.
          </p>
          
          {/* Quick Tips */}
          <div className="premium-card p-6 max-w-2xl mx-auto mb-8">
            <h2 className="font-semibold text-green-400 mb-3">Quick Start Guide:</h2>
            <ol className="text-left text-gray-300 space-y-2">
              <li>1. Enter your current pricing and competitor data below</li>
              <li>2. Click "Calculate Optimal Pricing" to see recommendations</li>
              <li>3. Export your results as a PDF to share with your team</li>
              <li>4. Bookmark this page - you have lifetime access!</li>
            </ol>
          </div>
          
          {/* Support Info */}
          <div className="text-sm text-gray-400">
            <p>Need help? Email us at support@predictionnexus.com</p>
            <p className="mt-2">
              Receipt sent to your email • Order ID: #{sessionId ? sessionId.slice(-8) : Date.now().toString().slice(-8)}
            </p>
          </div>
        </div>
        
        {/* Calculator */}
        <div className="mb-12">
          <Calculator />
        </div>
        
        {/* Footer with additional resources */}
        <div className="border-t border-gray-800 pt-8 mt-16">
          <div className="text-center">
            <h3 className="font-semibold mb-4 text-white">What's Next?</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="premium-card p-6">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold mb-2 text-white">Run Multiple Scenarios</h4>
                <p className="text-sm text-gray-400">Test different price points to find your sweet spot</p>
              </div>
              <div className="premium-card p-6">
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-semibold mb-2 text-white">Share With Team</h4>
                <p className="text-sm text-gray-400">Export PDFs to align your team on pricing strategy</p>
              </div>
              <div className="premium-card p-6">
                <div className="text-2xl mb-2">📈</div>
                <h4 className="font-semibold mb-2 text-white">Track Results</h4>
                <p className="text-sm text-gray-400">Implement changes and monitor conversion rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}