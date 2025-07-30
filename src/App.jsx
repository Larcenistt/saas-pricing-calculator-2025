import Success from './components/Success'
import CheckoutButton from './components/CheckoutButton'
import './App.css'

function App() {
  // Simple routing based on URL
  const isSuccess = window.location.pathname === '/success'
  const isDirect = window.location.pathname === '/calculator'
  
  // Direct access to calculator (for testing)
  if (isDirect) {
    return <Success />
  }

  if (isSuccess) {
    return <Success />
  }

  // Landing page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Stop Guessing Your SaaS Pricing
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get data-driven pricing recommendations in 5 minutes. 
            The same insights that cost $500+ from consultants.
          </p>
          
          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 max-w-sm mx-auto">
            <div className="mb-4">
              <span className="text-5xl font-bold text-gray-900">$99</span>
              <span className="text-xl text-gray-500 line-through ml-2">$197</span>
            </div>
            <p className="text-green-600 font-semibold mb-4">Limited Time: 50% OFF</p>
            <CheckoutButton className="w-full" />
            <p className="text-xs text-gray-500 mt-3">
              One-time payment • Instant access • No subscription
            </p>
          </div>

          {/* Access Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> After payment, return to this page and click "Access Calculator" below
            </p>
          </div>
        </div>

        {/* Pain Points */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Stop leaving money on the table
          </h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-start">
              <span className="text-red-500 mr-3">❌</span>
              <p className="text-gray-700">Pricing too low and missing out on revenue</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-3">❌</span>
              <p className="text-gray-700">Losing deals because your pricing doesn't make sense</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-3">❌</span>
              <p className="text-gray-700">Spending hours researching competitors manually</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Your pricing strategy in 5 minutes
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Competitor Analysis</h3>
              <p className="text-gray-600 text-sm">
                See exactly where you stand in the market
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="font-semibold mb-2">Optimal Pricing Tiers</h3>
              <p className="text-gray-600 text-sm">
                Get your perfect Good/Better/Best structure
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold mb-2">Ready-to-Use Export</h3>
              <p className="text-gray-600 text-sm">
                Professional PDF you can share with your team
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-16">
          <p className="text-center text-lg">
            🔥 <span className="font-bold">127 SaaS founders</span> already optimizing their 2025 pricing today
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Common Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Is this really a one-time payment?</h3>
              <p className="text-gray-600">Yes! Pay $99 once and use it forever. No subscriptions, no hidden fees.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How quickly do I get access?</h3>
              <p className="text-gray-600">Instantly after payment. The calculator loads right on the success page.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What if it doesn't work for my business?</h3>
              <p className="text-gray-600">30-day money-back guarantee. If you're not satisfied, email us for a full refund.</p>
            </div>
          </div>
        </div>

        {/* Access Calculator Section */}
        <div className="text-center bg-green-50 border-2 border-green-200 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold mb-4 text-green-900">
            Already Purchased?
          </h2>
          <p className="text-green-800 mb-6">
            Click below to access your pricing calculator
          </p>
          <a 
            href="/calculator" 
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Access Calculator Now →
          </a>
        </div>

        {/* Final CTA */}
        <div className="text-center bg-gray-900 text-white rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to optimize your pricing?
          </h2>
          <p className="text-gray-300 mb-6">
            Join 127+ SaaS founders who've already improved their pricing
          </p>
          <CheckoutButton 
            text="Get Instant Access - $99" 
            className="bg-white text-gray-900 hover:bg-gray-100"
          />
          <p className="text-sm text-gray-400 mt-4">
            🔒 Secure payment via Stripe
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              Questions? Email support@predictionnexus.com
            </p>
            <p>
              30-Day Money-Back Guarantee • One-Time Payment • No Subscription
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
