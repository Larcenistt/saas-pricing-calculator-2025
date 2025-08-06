import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './ui/GlassCard';
import Button from './ui/Button';
import toast from 'react-hot-toast';

export default function ReferralProgram() {
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    clicks: 0,
    signups: 0,
    purchases: 0,
    earned: 0
  });
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Generate or retrieve referral code
    let code = localStorage.getItem('referral_code');
    if (!code) {
      code = generateReferralCode();
      localStorage.setItem('referral_code', code);
    }
    setReferralCode(code);

    // Load stats (in production, fetch from backend)
    const stats = localStorage.getItem('referral_stats');
    if (stats) {
      setReferralStats(JSON.parse(stats));
    }
  }, []);

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const getReferralLink = () => {
    return `${window.location.origin}?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    toast.success('Referral link copied!');
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: '🐦',
      action: () => {
        const text = encodeURIComponent('Found this amazing SaaS pricing calculator that helped me increase revenue by 47%. Get $20 off:');
        const url = encodeURIComponent(getReferralLink());
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
      }
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      action: () => {
        const url = encodeURIComponent(getReferralLink());
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
      }
    },
    {
      name: 'Email',
      icon: '📧',
      action: () => {
        const subject = encodeURIComponent('SaaS Pricing Calculator - Get $20 Off');
        const body = encodeURIComponent(`Hey,\n\nI've been using this SaaS pricing calculator and it helped me realize I was underpricing by 40%!\n\nYou can get $20 off with my referral link: ${getReferralLink()}\n\nDefinitely worth checking out if you're in SaaS.`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
      }
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      action: copyReferralLink
    }
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Referral Program</h2>
          <p className="text-secondary/80 max-w-2xl mx-auto">
            Give $20, Get $20. Share your referral link and earn rewards for every purchase.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6">
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-secondary/60 mb-2">Link Clicks</p>
            <p className="text-3xl font-bold">{referralStats.clicks}</p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-secondary/60 mb-2">Sign-ups</p>
            <p className="text-3xl font-bold">{referralStats.signups}</p>
          </GlassCard>
          <GlassCard className="p-6 text-center">
            <p className="text-sm text-secondary/60 mb-2">Purchases</p>
            <p className="text-3xl font-bold">{referralStats.purchases}</p>
          </GlassCard>
          <GlassCard className="p-6 text-center border-primary/30">
            <p className="text-sm text-secondary/60 mb-2">Earned</p>
            <p className="text-3xl font-bold text-primary">${referralStats.earned}</p>
          </GlassCard>
        </div>

        {/* Referral Link */}
        <GlassCard className="p-8">
          <h3 className="text-xl font-semibold mb-4">Your Referral Link</h3>
          <div className="bg-dark/50 rounded-lg p-4 mb-6 flex items-center justify-between">
            <code className="text-sm text-primary break-all">{getReferralLink()}</code>
            <Button
              size="sm"
              variant="secondary"
              onClick={copyReferralLink}
              className="ml-4 flex-shrink-0"
            >
              Copy
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="secondary"
                onClick={option.action}
              >
                <span className="mr-2">{option.icon}</span>
                {option.name}
              </Button>
            ))}
          </div>
        </GlassCard>

        {/* How It Works */}
        <GlassCard className="p-8">
          <h3 className="text-xl font-semibold mb-6">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">Share Your Link</h4>
              <p className="text-sm text-secondary/80">
                Send your unique referral link to friends and colleagues in SaaS
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">They Get $20 Off</h4>
              <p className="text-sm text-secondary/80">
                Your referrals save $20 on their purchase (automatic discount)
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="font-semibold mb-2">You Earn $20</h4>
              <p className="text-sm text-secondary/80">
                Get $20 credit for each successful referral (no limit!)
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Email Templates */}
        <GlassCard className="p-8">
          <h3 className="text-xl font-semibold mb-4">Email Templates</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Quick Share</h4>
              <div className="bg-dark/50 rounded-lg p-4 text-sm text-secondary/80">
                Hey [Name],<br/><br/>
                Quick tip - I just discovered I was underpricing my SaaS by 40% using this calculator.<br/><br/>
                You get $20 off with my link: {getReferralLink()}<br/><br/>
                Takes 5 minutes and could increase your revenue significantly.
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Detailed Share</h4>
              <div className="bg-dark/50 rounded-lg p-4 text-sm text-secondary/80">
                Subject: You might be underpricing your SaaS<br/><br/>
                Hi [Name],<br/><br/>
                I wanted to share something that made a huge impact on our revenue.<br/><br/>
                We were charging $49/month for our SaaS. After using this pricing calculator, we realized we should be charging $89. 
                We raised prices and actually REDUCED churn because we attracted better customers.<br/><br/>
                The calculator analyzes your competitors, features, and market position to find your optimal price.<br/><br/>
                Here's $20 off if you want to try it: {getReferralLink()}<br/><br/>
                It's a one-time purchase (not another subscription) and takes about 5 minutes.<br/><br/>
                Let me know if you have questions!
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Terms */}
        <div className="text-center text-sm text-secondary/50">
          <p>Referral credits can be used for future purchases or cashed out monthly.</p>
          <p>Minimum payout: $100. Terms and conditions apply.</p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowShareModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-darker border border-subtle rounded-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Link Copied!</h3>
            <p className="text-secondary/80 mb-4">
              Your referral link has been copied to clipboard. Share it to start earning!
            </p>
            <Button onClick={() => setShowShareModal(false)} className="w-full">
              Got it
            </Button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}