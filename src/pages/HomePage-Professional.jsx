import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection-Professional';
import FeaturesSection from '../components/FeaturesSection-Professional';
import TestimonialsSection from '../components/TestimonialsSection-Professional';
import CTASection from '../components/CTASection-Professional';
import Footer from '../components/Footer-Professional';

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pt-16" // Account for fixed navigation
    >
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </motion.div>
  );
}