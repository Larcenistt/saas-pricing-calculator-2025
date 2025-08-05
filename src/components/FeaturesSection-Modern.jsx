export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Advanced Analytics',
      description: 'Track 20+ key SaaS metrics including LTV:CAC ratio, NRR, Rule of 40, and more.',
      color: 'primary'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      title: 'Competitor Analysis',
      description: 'Compare your pricing against competitors and find your optimal market position.',
      color: 'secondary'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI-Powered Insights',
      description: 'Get personalized recommendations based on your specific business model and data.',
      color: 'accent'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: 'Custom Pricing Tiers',
      description: 'Design pricing tiers that perfectly align with your customer segments.',
      color: 'primary'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Customer Segmentation',
      description: 'Identify and target different customer segments with tailored pricing strategies.',
      color: 'secondary'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Revenue Projections',
      description: 'Forecast revenue impact of pricing changes with 95% accuracy.',
      color: 'accent'
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            Everything You Need to
            <span className="gradient-text"> Optimize Pricing</span>
          </h2>
          <p className="lead max-w-2xl mx-auto">
            Our comprehensive toolkit helps you make data-driven pricing decisions
            that increase revenue and reduce churn.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group hover:-translate-y-1 transition-transform duration-300"
            >
              <div className={`
                w-14 h-14 rounded-xl flex items-center justify-center mb-6
                bg-gradient-to-br transition-all duration-300
                ${feature.color === 'primary' ? 'from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20' : ''}
                ${feature.color === 'secondary' ? 'from-secondary/20 to-secondary/10 group-hover:from-secondary/30 group-hover:to-secondary/20' : ''}
                ${feature.color === 'accent' ? 'from-accent/20 to-accent/10 group-hover:from-accent/30 group-hover:to-accent/20' : ''}
              `}>
                <span className={`
                  ${feature.color === 'primary' ? 'text-primary' : ''}
                  ${feature.color === 'secondary' ? 'text-secondary' : ''}
                  ${feature.color === 'accent' ? 'text-accent' : ''}
                `}>
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}