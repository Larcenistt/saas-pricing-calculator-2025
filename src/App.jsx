import { useState, useEffect } from 'react'
import Success from './components/Success'
import BuyButtonWrapper from './components/BuyButtonWrapper'
import Privacy from './components/Privacy'
import Terms from './components/Terms'
import './App.css'
import './premium-dark.css'

function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  // Simple routing based on URL
  const isSuccess = window.location.pathname === '/success'
  const isDirect = window.location.pathname === '/calculator'
  const isPrivacy = window.location.pathname === '/privacy'
  const isTerms = window.location.pathname === '/terms'
  
  // Set loaded state after component mounts
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  // Handle routing
  if (isDirect) {
    return <Success />
  }

  if (isSuccess) {
    return <Success />
  }
  
  if (isPrivacy) {
    return <Privacy />
  }
  
  if (isTerms) {
    return <Terms />
  }

  // Landing page
  return (
    <div className={`min-h-screen premium-bg text-white transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Trust Banner */}
        <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-lg p-3 mb-8 text-center">
          <p className="text-sm font-medium text-green-400">
            ✓ 30-Day Money Back Guarantee • ✓ One-Time Payment • ✓ Instant Access
          </p>
        </div>
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="mb-6">
            <span className="badge">LAUNCH SPECIAL</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 premium-title">
            Stop Leaving Money<br/>
            <span className="gradient-text">On The Table</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Data-driven pricing recommendations that increase your revenue by 20-80% in just 5 minutes.
          </p>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 border-2 border-gray-900" />
              ))}
            </div>
            <p className="text-gray-300">
              <span className="text-white font-semibold">2,847+ founders</span> optimized their pricing this week
            </p>
          </div>
          
          {/* Pricing Card */}
          <div className="premium-card p-8 max-w-md mx-auto glow-green">
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-2">One-Time Purchase</p>
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-5xl font-bold">$99</span>
              </div>
              <p className="text-green-400 font-semibold mt-2">Lifetime Access</p>
            </div>
            
            <BuyButtonWrapper />
            
            <div className="space-y-2 text-sm text-gray-400">
              <p>✓ Lifetime access</p>
              <p>✓ 30-day money-back guarantee</p>
              <p>✓ Free updates forever</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                🔒 Secure payment powered by Stripe
              </p>
            </div>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 mt-8 text-gray-400">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">4.9/5</p>
              <p className="text-sm">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">5min</p>
              <p className="text-sm">Setup Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-sm">Support</p>
            </div>
          </div>
        </div>

        {/* Problem Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 premium-title">
            The Hidden Cost of Bad Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="premium-card p-6 hover:scale-105 transition-transform">
              <div className="text-red-400 text-4xl mb-4">📉</div>
              <h3 className="text-xl font-semibold mb-2">Lost Revenue</h3>
              <p className="text-gray-400">
                Underpricing by just 10% costs you thousands every month
              </p>
            </div>
            <div className="premium-card p-6 hover:scale-105 transition-transform">
              <div className="text-orange-400 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Missed Opportunities</h3>
              <p className="text-gray-400">
                Competitors with better pricing steal your customers daily
              </p>
            </div>
            <div className="premium-card p-6 hover:scale-105 transition-transform">
              <div className="text-yellow-400 text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2">Wasted Time</h3>
              <p className="text-gray-400">
                Hours spent on spreadsheets that don't give clear answers
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 premium-title">
            Your Complete Pricing Toolkit
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Everything you need to optimize your pricing in minutes, not months
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="feature-icon group-hover:scale-110 transition-transform">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Competitor Analysis</h3>
              <p className="text-gray-400">
                Instantly see how your pricing compares to the market
              </p>
            </div>
            <div className="text-center group">
              <div className="feature-icon group-hover:scale-110 transition-transform">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-gray-400">
                AI-powered suggestions based on your specific market
              </p>
            </div>
            <div className="text-center group">
              <div className="feature-icon group-hover:scale-110 transition-transform">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Revenue Projections</h3>
              <p className="text-gray-400">
                See exactly how much more you could be earning
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 premium-title">
            Trusted by Smart Founders
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="testimonial-card">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Increased our revenue by 47% in the first month. This tool paid for itself in 2 days."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500" />
                <div>
                  <p className="font-semibold">Sarah Chen</p>
                  <p className="text-sm text-gray-500">Founder, TechFlow</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "Finally understood why we were losing deals. Fixed our pricing tiers and doubled conversions."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-500" />
                <div>
                  <p className="font-semibold">Mike Rodriguez</p>
                  <p className="text-sm text-gray-500">CEO, CloudBase</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "The ROI is insane. Wish I had found this tool 2 years ago. Would have saved us $100k+."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-red-500" />
                <div>
                  <p className="font-semibold">Emma Wilson</p>
                  <p className="text-sm text-gray-500">Founder, DataSync</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 premium-title">
            Common Questions
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="premium-card p-6">
              <h3 className="text-xl font-semibold mb-2">How quickly will I see results?</h3>
              <p className="text-gray-400">
                Most users implement new pricing within 24 hours and see revenue increases within the first week. The calculator takes just 5 minutes to complete.
              </p>
            </div>
            
            <div className="premium-card p-6">
              <h3 className="text-xl font-semibold mb-2">Is this really a one-time payment?</h3>
              <p className="text-gray-400">
                Yes! Pay once, use forever. No subscriptions, no hidden fees. You also get all future updates at no additional cost.
              </p>
            </div>
            
            <div className="premium-card p-6">
              <h3 className="text-xl font-semibold mb-2">What if it doesn't work for my business?</h3>
              <p className="text-gray-400">
                We offer a 30-day money-back guarantee. If you're not completely satisfied, email us for a full refund - no questions asked.
              </p>
            </div>
            
            <div className="premium-card p-6">
              <h3 className="text-xl font-semibold mb-2">Do I need any technical knowledge?</h3>
              <p className="text-gray-400">
                Not at all! The calculator is designed for non-technical founders. Just enter your current pricing and competitors - we handle the complex calculations.
              </p>
            </div>
          </div>
        </div>

        {/* Already Purchased Section */}
        <div className="text-center mb-20">
          <div className="premium-card p-8 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Already Purchased?</h2>
            <p className="text-gray-400 mb-6">
              Access your pricing calculator and start optimizing
            </p>
            <a 
              href="/calculator" 
              className="premium-button inline-block"
            >
              Access Calculator →
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center premium-card p-12 max-w-4xl mx-auto glow-purple">
          <h2 className="text-4xl font-bold mb-4 premium-title">
            Ready to Stop Leaving Money on the Table?
          </h2>
          
          <p className="text-xl text-gray-300 mb-8">
            Join 2,847+ smart founders who've already optimized their pricing
          </p>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <p className="text-green-400 font-semibold">
              ✓ Trusted by 2,847+ SaaS Founders
            </p>
          </div>
          
          <BuyButtonWrapper />
          
          <p className="text-gray-500 text-sm">
            30-day money-back guarantee • Lifetime access • Free updates forever
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center text-gray-400">
            <p className="mb-2">
              Questions? Email support@predictionnexus.com
            </p>
            <p className="text-sm">
              © 2025 Prediction Nexus • <a href="/privacy" className="hover:text-white">Privacy Policy</a> • <a href="/terms" className="hover:text-white">Terms of Service</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App