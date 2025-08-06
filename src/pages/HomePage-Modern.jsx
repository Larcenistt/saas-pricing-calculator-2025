import { useEffect } from 'react';
import HeroSection from '../components/HeroSection-Modern';
import FeaturesSection from '../components/FeaturesSection-Modern';
import TestimonialsSection from '../components/TestimonialsSection-Modern';
import TestimonialsQuick from '../components/TestimonialsQuick';
import CTASection from '../components/CTASection-Modern';
import Footer from '../components/Footer-Modern';

export default function HomePage() {
  // Add smooth scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <TestimonialsQuick />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}