import { Link } from 'react-router-dom';

export default function ResourcesPage() {
  const resources = [
    {
      title: 'Getting Started Guide',
      description: 'Learn how to use the SaaS Pricing Calculator effectively',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      items: [
        'Understanding your current pricing model',
        'Gathering competitor data',
        'Analyzing customer segments',
        'Implementing pricing changes',
        'Measuring success metrics'
      ]
    },
    {
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides and best practices',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      videos: [
        { title: 'Quick Start Tutorial', duration: '5 min', status: 'available' },
        { title: 'Advanced Pricing Strategies', duration: '12 min', status: 'coming-soon' },
        { title: 'Case Study: B2B SaaS', duration: '8 min', status: 'coming-soon' },
        { title: 'Export and Reporting', duration: '6 min', status: 'coming-soon' }
      ]
    },
    {
      title: 'Frequently Asked Questions',
      description: 'Get answers to common questions',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      faqs: [
        {
          question: 'How accurate is the pricing recommendation?',
          answer: 'Our AI-powered calculator analyzes over 10,000 SaaS companies and considers multiple factors including your industry, features, and target market to provide recommendations with 85%+ accuracy.'
        },
        {
          question: 'Can I export the results?',
          answer: 'Yes! You can export your pricing analysis as a professional PDF report that includes all calculations, recommendations, and competitor comparisons.'
        },
        {
          question: 'Is my data secure?',
          answer: 'Absolutely. We use bank-level encryption and never store your sensitive business data. All calculations are performed locally in your browser.'
        },
        {
          question: 'Do I get updates to the calculator?',
          answer: 'Yes, your one-time purchase includes lifetime access to all future updates and improvements to the calculator.'
        }
      ]
    },
    {
      title: 'Best Practices',
      description: 'Learn proven strategies for SaaS pricing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      practices: [
        'Value-based pricing over cost-plus',
        'Implement usage-based tiers for scalability',
        'A/B test pricing changes with cohorts',
        'Monitor competitor pricing quarterly',
        'Align pricing with customer success metrics'
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="mb-6">Resources & Learning Center</h1>
          <p className="lead max-w-3xl mx-auto">
            Everything you need to master SaaS pricing strategy and maximize your revenue potential
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Getting Started Guide */}
          <div className="glass-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                {resources[0].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{resources[0].title}</h3>
                <p className="text-secondary">{resources[0].description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {resources[0].items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-secondary">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/calculator" className="btn btn-primary w-full mt-6">
              Start Calculator
            </Link>
          </div>

          {/* Video Tutorials */}
          <div className="glass-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                {resources[1].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{resources[1].title}</h3>
                <p className="text-secondary">{resources[1].description}</p>
              </div>
            </div>
            <div className="space-y-3">
              {resources[1].videos.map((video, index) => (
                <div key={index} className="p-4 rounded-lg bg-glass-primary border border-glass-border hover:bg-glass-secondary transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                      </svg>
                      <span className="font-medium">{video.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">{video.duration}</span>
                      {video.status === 'coming-soon' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="glass-card lg:col-span-2">
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                {resources[2].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{resources[2].title}</h3>
                <p className="text-secondary">{resources[2].description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {resources[2].faqs.map((faq, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-semibold text-lg">{faq.question}</h4>
                  <p className="text-secondary leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Best Practices */}
          <div className="glass-card lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                {resources[3].icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{resources[3].title}</h3>
                <p className="text-secondary">{resources[3].description}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources[3].practices.map((practice, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-glass-primary border border-glass-border">
                  <svg className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-secondary">{practice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center glass-card max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold mb-4">Need More Help?</h3>
          <p className="text-secondary mb-6">
            Our support team is here to help you succeed with your pricing strategy
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@predictionnexus.com" 
              className="btn btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </a>
            <Link to="/calculator" className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Try Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}