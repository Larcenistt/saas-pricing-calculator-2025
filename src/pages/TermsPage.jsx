import GlassCard from '../components/ui/GlassCard';

export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <GlassCard className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Agreement</h2>
                <p>
                  By purchasing and using PriceGenius SaaS Pricing Calculator, you agree to these Terms of Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">License</h2>
                <p>
                  Upon purchase, you receive a lifetime license to use the SaaS Pricing Calculator for your business needs. 
                  This license is non-transferable and for single-business use.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Refund Policy</h2>
                <p>
                  We offer a 30-day money-back guarantee. If you're not satisfied with the calculator, 
                  contact us at support@predictionnexus.com for a full refund.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Limitations</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The calculator provides recommendations based on algorithms and market data</li>
                  <li>Results are not guaranteed and should be validated for your specific market</li>
                  <li>We are not responsible for business decisions made based on calculator output</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Support</h2>
                <p>
                  We provide email support for all customers. Response time is typically within 24 hours 
                  during business days.
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