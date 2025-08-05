import GlassCard from '../components/ui/GlassCard';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <GlassCard className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                <p>
                  PriceGenius ("we", "our", or "us") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, and safeguard your information 
                  when you use our SaaS Pricing Calculator.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Email address (for order confirmation and support)</li>
                  <li>Usage data (anonymous analytics to improve our service)</li>
                  <li>Calculator inputs (stored locally in your browser only)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process your payment and provide access to the calculator</li>
                  <li>Send order confirmations and important updates</li>
                  <li>Provide customer support</li>
                  <li>Improve our products and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
                <p>
                  We implement industry-standard security measures to protect your information. 
                  All payment processing is handled by Stripe, a PCI-compliant payment processor. 
                  We never store credit card information on our servers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:support@predictionnexus.com" className="text-primary hover:underline">
                    support@predictionnexus.com
                  </a>
                </p>
              </section>

              <section>
                <p className="text-sm text-gray-400 mt-8">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </section>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}