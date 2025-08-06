import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import GlassCard from './ui/GlassCard';

export default function TestimonialCarousel() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "CEO, TechFlow SaaS",
      company: "Series B Startup",
      quote: "This calculator helped us increase our revenue by 47% in just 3 months. The AI insights were game-changing for our pricing strategy.",
      metrics: "+47% Revenue",
      image: "SC"
    },
    {
      name: "Michael Rodriguez",
      role: "Founder, CloudBase Pro",
      company: "B2B SaaS",
      quote: "We were underpricing by 40%! After using this tool, we confidently raised prices and actually reduced churn. Incredible ROI.",
      metrics: "-15% Churn",
      image: "MR"
    },
    {
      name: "Emma Thompson",
      role: "VP Sales, DataSync",
      company: "Enterprise SaaS",
      quote: "The competitor analysis and pricing tiers recommendations were spot on. Our sales team closes deals 30% faster now.",
      metrics: "+30% Close Rate",
      image: "ET"
    },
    {
      name: "David Park",
      role: "Product Manager, APIConnect",
      company: "Developer Tools",
      quote: "Best $99 I've ever spent. The advanced metrics like LTV:CAC ratio and Rule of 40 calculations saved us weeks of analysis.",
      metrics: "5x ROI",
      image: "DP"
    },
    {
      name: "Lisa Zhang",
      role: "COO, ScaleUp Analytics",
      company: "Data Platform",
      quote: "Our pricing was a mess before this. Now we have clear tiers, better positioning, and 62% higher average contract value.",
      metrics: "+62% ACV",
      image: "LZ"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000); // Change every 5 seconds

      return () => clearInterval(timer);
    }
  }, [isPaused, testimonials.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div 
      className="relative max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8 md:p-12">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0 hidden md:block">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl">
                  {currentTestimonial.image}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                {/* Quote */}
                <div className="relative mb-6">
                  <div className="absolute -top-4 -left-2 text-6xl text-primary/20">"</div>
                  <p className="text-lg md:text-xl text-gray-300 italic relative z-10 pl-6">
                    {currentTestimonial.quote}
                  </p>
                </div>
                
                {/* Author Info */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white font-semibold">{currentTestimonial.name}</p>
                    <p className="text-gray-400 text-sm">{currentTestimonial.role}</p>
                    <p className="text-gray-500 text-xs">{currentTestimonial.company}</p>
                  </div>
                  
                  {/* Metric Badge */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-full"
                  >
                    <p className="text-green-400 font-bold">{currentTestimonial.metrics}</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 md:-translate-x-16 p-3 glass rounded-full hover:bg-white/10 transition-all"
        aria-label="Previous testimonial"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 md:translate-x-16 p-3 glass rounded-full hover:bg-white/10 transition-all"
        aria-label="Next testimonial"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-8 bg-primary' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Autoplay Indicator */}
      {!isPaused && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-primary/30 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          key={`progress-${currentIndex}`}
        />
      )}
    </div>
  );
}