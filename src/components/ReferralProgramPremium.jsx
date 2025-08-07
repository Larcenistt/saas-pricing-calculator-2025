import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackEvent } from '../utils/analytics';
import confetti from 'canvas-confetti';

export default function ReferralProgramPremium() {
  const [isOpen, setIsOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralUrl, setReferralUrl] = useState('');
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Commission structure
  const COMMISSION_RATE = 0.30; // 30% commission
  const TIERS = {
    starter: { price: 99, commission: 30 },
    professional: { price: 199, commission: 60 },
    enterprise: { price: 499, commission: 150 }
  };

  useEffect(() => {
    // Load existing referral data
    const userData = localStorage.getItem('referral_data');
    if (userData) {
      const data = JSON.parse(userData);
      setReferralCode(data.code);
      setReferralUrl(data.url);
      setReferrals(data.referrals || []);
      setEarnings(data.earnings || 0);
      setEmail(data.email || '');
    }

    // Check if should auto-show based on purchase
    const hasPurchased = localStorage.getItem('purchase_completed');
    const hasSeenReferral = sessionStorage.getItem('referral_program_seen');
    
    if (hasPurchased && !hasSeenReferral) {
      setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('referral_program_seen', 'true');
      }, 15000); // Show 15 seconds after purchase
    }
  }, []);

  const generateReferralCode = async () => {
    setIsGenerating(true);
    
    try {
      // Generate unique code
      const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const url = `${window.location.origin}?ref=${code}`;
      
      // Save referral data
      const referralData = {
        code,
        url,
        email,
        createdAt: new Date().toISOString(),
        referrals: [],
        earnings: 0
      };
      
      localStorage.setItem('referral_data', JSON.stringify(referralData));
      
      setReferralCode(code);
      setReferralUrl(url);
      
      // Track event
      trackEvent('referral_program_joined', {
        code,
        email
      });
      
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      
    } catch (error) {
      console.error('Error generating referral code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      
      trackEvent('referral_copied', {
        type,
        code: referralCode
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareOnSocial = (platform) => {
    const message = encodeURIComponent(
      `I saved 30% on my SaaS pricing strategy using this calculator! Use my code ${referralCode} for 20% off: `
    );
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${message}&url=${encodeURIComponent(referralUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=400');
    
    trackEvent('referral_shared', {
      platform,
      code: referralCode
    });
  };

  // Simulated referral data for demonstration
  const mockReferrals = [
    { name: 'John D.', tier: 'professional', date: '2 days ago', commission: 60, status: 'paid' },
    { name: 'Sarah M.', tier: 'starter', date: '5 days ago', commission: 30, status: 'paid' },
    { name: 'Mike R.', tier: 'enterprise', date: '1 week ago', commission: 150, status: 'pending' }
  ];

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-xl">💰</span>
        <span className="font-bold">Earn 30% Commission</span>
        {earnings > 0 && (
          <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
            ${earnings}
          </span>
        )}
      </motion.button>

      {/* Main modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="relative p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4 mx-auto shadow-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-4xl">💸</span>
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Earn 30% Commission
                    </h2>
                    <p className="text-gray-300">
                      Share the SaaS Calculator and earn for every sale
                    </p>
                  </div>

                  {!referralCode ? (
                    // Generate referral code form
                    <form onSubmit={(e) => { e.preventDefault(); generateReferralCode(); }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Email (for commission payments)
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          required
                        />
                      </div>

                      <div className="bg-black/30 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">How it works:</h3>
                        <div className="space-y-2">
                          <div className="flex items-start gap-3">
                            <span className="text-purple-400 mt-1">1.</span>
                            <span className="text-gray-300">Get your unique referral link</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-purple-400 mt-1">2.</span>
                            <span className="text-gray-300">Share with your network</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="text-purple-400 mt-1">3.</span>
                            <span className="text-gray-300">Earn 30% on every sale ($30-$150 per sale)</span>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-2xl transform transition-all duration-200 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isGenerating ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating Your Link...
                          </span>
                        ) : (
                          'Get My Referral Link →'
                        )}
                      </motion.button>
                    </form>
                  ) : (
                    // Show referral dashboard
                    <div className="space-y-6">
                      {/* Earnings overview */}
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Total Earnings</p>
                            <p className="text-3xl font-bold text-white">
                              ${earnings > 0 ? earnings : mockReferrals.reduce((sum, r) => sum + r.commission, 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">Referrals</p>
                            <p className="text-2xl font-bold text-purple-400">
                              {referrals.length > 0 ? referrals.length : mockReferrals.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Referral link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Referral Link
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralUrl}
                            readOnly
                            className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white"
                          />
                          <motion.button
                            onClick={() => copyToClipboard(referralUrl, 'url')}
                            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {copied ? '✓' : '📋'}
                          </motion.button>
                        </div>
                      </div>

                      {/* Referral code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Your Referral Code
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralCode}
                            readOnly
                            className="flex-1 px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white font-mono text-lg"
                          />
                          <motion.button
                            onClick={() => copyToClipboard(referralCode, 'code')}
                            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {copied ? '✓' : '📋'}
                          </motion.button>
                        </div>
                      </div>

                      {/* Social sharing */}
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-3">Share on Social Media</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => shareOnSocial('twitter')}
                            className="flex-1 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-bold transition-colors"
                          >
                            Twitter
                          </button>
                          <button
                            onClick={() => shareOnSocial('linkedin')}
                            className="flex-1 py-3 bg-[#0077B5] hover:bg-[#006097] text-white rounded-lg font-bold transition-colors"
                          >
                            LinkedIn
                          </button>
                          <button
                            onClick={() => shareOnSocial('facebook')}
                            className="flex-1 py-3 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-bold transition-colors"
                          >
                            Facebook
                          </button>
                        </div>
                      </div>

                      {/* Recent referrals */}
                      <div>
                        <h3 className="text-white font-semibold mb-3">Recent Referrals</h3>
                        <div className="space-y-2">
                          {(referrals.length > 0 ? referrals : mockReferrals).map((referral, index) => (
                            <div key={index} className="bg-black/30 rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">{referral.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {referral.tier} • {referral.date}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-400 font-bold">+${referral.commission}</p>
                                <p className="text-xs text-gray-400">{referral.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Commission rates */}
                      <div className="bg-black/30 rounded-xl p-4">
                        <h3 className="text-white font-semibold mb-3">Commission Rates</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-300">
                            <span>Starter ($99)</span>
                            <span className="text-emerald-400 font-bold">$30 commission</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Professional ($199)</span>
                            <span className="text-emerald-400 font-bold">$60 commission</span>
                          </div>
                          <div className="flex justify-between text-gray-300">
                            <span>Enterprise ($499)</span>
                            <span className="text-emerald-400 font-bold">$150 commission</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-3">
                          Payments processed monthly via PayPal or bank transfer
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}