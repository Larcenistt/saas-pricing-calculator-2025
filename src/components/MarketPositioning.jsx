import { motion } from 'framer-motion';

export default function MarketPositioning() {
  const competitors = [
    {
      type: 'Free Calculators',
      price: '$0',
      features: {
        'Basic Calculations': true,
        'SaaS-Specific Metrics': false,
        'Competitor Analysis': false,
        'AI Recommendations': false,
        'Custom Reports': false,
        'Industry Templates': false,
        'Expert Support': false,
        'Regular Updates': false,
      },
      verdict: 'Too basic for serious businesses'
    },
    {
      type: 'Our Solution',
      price: '$99-499',
      highlight: true,
      features: {
        'Basic Calculations': true,
        'SaaS-Specific Metrics': true,
        'Competitor Analysis': true,
        'AI Recommendations': true,
        'Custom Reports': true,
        'Industry Templates': true,
        'Expert Support': true,
        'Regular Updates': true,
      },
      verdict: 'Perfect balance of features & price'
    },
    {
      type: 'Enterprise Tools',
      price: '$5K-50K+/year',
      features: {
        'Basic Calculations': true,
        'SaaS-Specific Metrics': true,
        'Competitor Analysis': true,
        'AI Recommendations': true,
        'Custom Reports': true,
        'Industry Templates': true,
        'Expert Support': true,
        'Regular Updates': true,
      },
      verdict: 'Overkill for most SaaS companies'
    }
  ];

  const featureList = Object.keys(competitors[0].features);

  return (
    <section className="py-20 relative bg-gradient-to-b from-gray-900/50 to-gray-900">
      <div className="container">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-4 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold"
          >
            MARKET POSITIONING
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Why We're The <span className="gradient-text">Sweet Spot</span>
          </motion.h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            You shouldn't have to choose between tools that don't work and tools you can't afford
          </p>
        </div>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="min-w-[800px]"
          >
            <div className="grid grid-cols-4 gap-4">
              {/* Header Row */}
              <div className="p-4 font-semibold text-gray-400">Features</div>
              {competitors.map((comp, idx) => (
                <div 
                  key={idx}
                  className={`p-6 rounded-xl text-center ${
                    comp.highlight 
                      ? 'bg-gradient-to-b from-primary/20 to-primary/5 border-2 border-primary transform scale-105' 
                      : 'bg-gray-800/50 border border-gray-700'
                  }`}
                >
                  {comp.highlight && (
                    <div className="inline-block mb-2 px-3 py-1 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold rounded-full">
                      BEST VALUE
                    </div>
                  )}
                  <div className="font-bold text-lg mb-2">{comp.type}</div>
                  <div className={`text-3xl font-bold mb-4 ${
                    comp.highlight ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {comp.price}
                  </div>
                </div>
              ))}

              {/* Feature Rows */}
              {featureList.map((feature, idx) => (
                <>
                  <div key={`feature-${idx}`} className="p-4 font-medium text-gray-300 border-t border-gray-800">
                    {feature}
                  </div>
                  {competitors.map((comp, compIdx) => (
                    <div 
                      key={`comp-${compIdx}-${idx}`}
                      className={`p-4 text-center border-t border-gray-800 ${
                        comp.highlight ? 'bg-primary/5' : ''
                      }`}
                    >
                      {comp.features[feature] ? (
                        <span className="text-green-500 text-2xl">✓</span>
                      ) : (
                        <span className="text-gray-600 text-xl">✗</span>
                      )}
                    </div>
                  ))}
                </>
              ))}

              {/* Verdict Row */}
              <div className="p-4 font-bold text-gray-300 border-t-2 border-gray-700">
                Bottom Line
              </div>
              {competitors.map((comp, idx) => (
                <div 
                  key={`verdict-${idx}`}
                  className={`p-4 text-center text-sm border-t-2 border-gray-700 ${
                    comp.highlight 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'text-gray-500'
                  }`}
                >
                  {comp.verdict}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Social Proof */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">527+</div>
              <div className="text-sm text-gray-400">Companies Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-gray-400">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">20-80%</div>
              <div className="text-sm text-gray-400">Revenue Increase</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2 Hours</div>
              <div className="text-sm text-gray-400">Average Setup Time</div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-xl mb-6 text-gray-300">
            Join smart SaaS companies who chose the <span className="text-primary font-bold">professional solution</span>
          </p>
          <a 
            href="#pricing" 
            className="premium-button inline-block text-lg px-8 py-4 pulse-glow"
          >
            View Pricing Options →
          </a>
          <p className="text-sm text-gray-500 mt-4">
            30-day money-back guarantee • Instant access • One-time payment
          </p>
        </motion.div>
      </div>
    </section>
  );
}