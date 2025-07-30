export default function Terms() {
  return (
    <div className="min-h-screen premium-bg text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 premium-title">Terms of Service</h1>
        
        <div className="premium-card p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p className="text-gray-300">
              By accessing and using the SaaS Pricing Calculator, you agree to be bound by 
              these Terms of Service. If you do not agree to these terms, please do not use 
              our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-gray-300">
              The SaaS Pricing Calculator is a tool that provides pricing recommendations 
              based on market data and user inputs. It is a one-time purchase product with 
              lifetime access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Purchase and Payment</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>The product is available for a one-time fee of $99 USD</li>
              <li>Payment is processed securely through Stripe</li>
              <li>All sales are final, subject to our refund policy</li>
              <li>You receive lifetime access upon purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Refund Policy</h2>
            <p className="text-gray-300">
              We offer a 30-day money-back guarantee. If you're not satisfied with the product, 
              contact us at support@predictionnexus.com within 30 days of purchase for a full 
              refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-gray-300 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Share your access with unauthorized users</li>
              <li>Attempt to reverse engineer the calculator</li>
              <li>Use the service for any illegal purposes</li>
              <li>Resell or redistribute the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
            <p className="text-gray-300">
              The service is provided "as is" without warranties of any kind. We do not 
              guarantee specific results from using the calculator. Pricing decisions are 
              ultimately your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-gray-300">
              In no event shall Prediction Nexus be liable for any indirect, incidental, 
              special, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-gray-300">
              All content and functionality of the SaaS Pricing Calculator are owned by 
              Prediction Nexus and are protected by copyright and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. Continued use of the 
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Contact Information</h2>
            <p className="text-gray-300">
              For questions about these Terms of Service:<br/>
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