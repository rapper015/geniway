'use client';

import { useState, useEffect } from 'react';
import TopBanner from '../components/TopBanner';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import AuthModal from '../components/auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleShowAuthModal = () => setShowAuthModal(true);
    window.addEventListener('showAuthModal', handleShowAuthModal);
    
    return () => {
      window.removeEventListener('showAuthModal', handleShowAuthModal);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <TopBanner />
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
