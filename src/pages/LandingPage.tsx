import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Footer from '@/components/Footer';
import BrandLogo from '@/components/BrandLogo';
import HeroScrollAnimation from '@/components/HeroScrollAnimation';
import CinematicShowcase from '@/components/cinematic/CinematicShowcase';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    // Flip nav to dark text near the end of the hero (650vh tall) as it fades to white.
    const handleScroll = () => setIsScrolled(window.scrollY > window.innerHeight * 5.3);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white noise-bg">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`h-16 fixed top-0 inset-x-0 z-50 transition-colors duration-300 flex items-center justify-between px-6 lg:px-12 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-black/5 text-black' : 'bg-transparent text-white'
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <BrandLogo size="lg" dark={isScrolled} />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {['Features', 'Pricing', 'About', 'Blog'].map(l => (
            <Link key={l} to={`/${l.toLowerCase()}`} className="relative group hover:inherit transition-colors">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium inherit hover:text-primary transition-colors hidden sm:inline-block">Sign In</Link>
          <Link to="/login" className="gradient-primary text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 inline-block">
            Get Started
          </Link>
        </div>
      </motion.nav>

      <HeroScrollAnimation />
      <CinematicShowcase />

      <Footer />
    </div>
  );
}
