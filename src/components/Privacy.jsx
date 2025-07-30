export default function Privacy() {
  return (
    <div className="min-h-screen premium-bg text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 premium-title">Privacy Policy</h1>
        
        <div className="premium-card p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Overview</h2>
            <p className="text-gray-300">
              Prediction Nexus ("we", "our", or "us") operates the SaaS Pricing Calculator. 
              This page informs you of our policies regarding the collection, use, and disclosure 
              of personal information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Information We Collect</h2>
            <p className="text-gray-300 mb-3">We collect minimal information:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Email address (when you contact support)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Usage data (anonymous analytics via Google Analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Data Security</h2>
            <p className="text-gray-300">
              We use commercially acceptable means to protect your personal information. 
              Payment processing is handled by Stripe, which is PCI-compliant. We do not 
              store credit card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Third Party Services</h2>
            <p className="text-gray-300 mb-3">We use the following third-party services:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Stripe - Payment processing</li>
              <li>Google Analytics - Anonymous usage analytics</li>
              <li>Vercel - Website hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Your Rights</h2>
            <p className="text-gray-300">
              You have the right to access, update, or delete your personal information. 
              Contact us at support@predictionnexus.com to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at:<br/>
              Email: support@predictionnexus.com
            </p>
          </section>

          <section>
            <p className="text-sm text-gray-500 mt-8">
              Last updated: January 29, 2025
            </p>
          </section>
        </div>

        <div className="text-center mt-8">
          <a href="/" className="text-green-400 hover:text-green-300">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}