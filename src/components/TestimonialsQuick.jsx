import React from 'react';

const testimonials = [
  {
    name: "Sarah Chen",
    company: "DataFlow Analytics",
    role: "CEO & Founder",
    content: "Increased our revenue by 34% in just 6 weeks. The pricing insights were game-changing.",
    rating: 5,
    revenue: "+34%"
  },
  {
    name: "Michael Rodriguez",
    company: "CloudSync Pro",
    role: "Head of Growth",
    content: "Finally understood our true LTV:CAC ratio. Raised prices 40% without losing customers.",
    rating: 5,
    revenue: "+40%"
  },
  {
    name: "Jennifer Park",
    company: "AutomateIQ",
    role: "VP Sales",
    content: "The competitor analysis alone was worth 10x the price. Closed 3 enterprise deals using these insights.",
    rating: 5,
    revenue: "+$240K"
  },
  {
    name: "David Thompson",
    company: "ScaleOps",
    role: "Founder",
    content: "Went from $20K to $32K MRR in 2 months. Should have bought this sooner.",
    rating: 5,
    revenue: "+60%"
  },
  {
    name: "Lisa Anderson",
    company: "MetricsHub",
    role: "Product Manager",
    content: "Used the PDF export to convince our board to approve a pricing change. ROI in 1 week.",
    rating: 5,
    revenue: "+$1.2M ARR"
  }
];

export default function TestimonialsQuick() {
  return (
    <section className="py-20 bg-gradient-to-b from-transparent to-black/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">527 Companies</span> Optimized Their Pricing
          </h2>
          <p className="text-xl text-muted">
            Join successful SaaS founders who transformed their revenue
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-card p-6 hover:scale-105 transition-all duration-300"
            >
              {/* Revenue Badge */}
              <div className="mb-4">
                <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {testimonial.revenue} Revenue
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-sm mb-4 text-muted leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="border-t border-gray-700 pt-4">
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-muted">
                  {testimonial.role} at {testimonial.company}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">$4.2M+</div>
              <div className="text-sm text-muted">Additional Revenue Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">93%</div>
              <div className="text-sm text-muted">See ROI in 30 Days</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text">4.9/5</div>
              <div className="text-sm text-muted">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}