'use client';

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import InlineInputBar from "../components/InlineInputBar";
import TrustChips from "../components/TrustChips";
import SocialProof from "../components/SocialProof";
import HowItWorks from "../components/HowItWorks";
import FeaturesGrid from "../components/FeaturesGrid";
import ParentsBlock from "../components/ParentsBlock";
import BoardsSubjects from "../components/BoardsSubjects";
import FAQ from "../components/FAQ";
import FinalCTA from "../components/FinalCTA";
import StickyBottomBar from "../components/StickyBottomBar";
import SampleBottomSheet from "../components/SampleBottomSheet";
import RoutingSkeleton from "../components/RoutingSkeleton";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const [guestUuid, setGuestUuid] = useState(null);
  const [isGuestSessionInitialized, setIsGuestSessionInitialized] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { login } = useAuth();

  // Initialize guest session on first visit
  useEffect(() => {
    const initializeGuestSession = async () => {
      try {
        // Generate a persistent guest UUID
        let existingGuestUuid = localStorage.getItem('guest_uuid');
        
        if (existingGuestUuid) {
          setGuestUuid(existingGuestUuid);
          console.log('[Home] Returning guest session loaded:', existingGuestUuid);
        } else {
          // Create new guest UUID
          const newGuestUuid = `guest_${Date.now()}`;
          localStorage.setItem('guest_uuid', newGuestUuid);
          setGuestUuid(newGuestUuid);
          console.log('[Home] New guest session created:', newGuestUuid);
        }
        
        setIsGuestSessionInitialized(true);
      } catch (error) {
        console.error('[Home] Failed to initialize guest session:', error);
        setIsGuestSessionInitialized(true);
      }
    };

    initializeGuestSession();
  }, []);

  useEffect(() => {
    // Auto-focus hero input after 300ms when guest session is ready
    if (isGuestSessionInitialized) {
      setTimeout(() => {
        const input = document.getElementById('doubtInput');
        if (input) {
          input.focus();
        }
      }, 300);
    }

    // Show mic tooltip on first visit
    if (!localStorage.getItem('gw_mic_tooltip_shown')) {
      setTimeout(() => {
        const tooltip = document.querySelector('.mic-tooltip');
        if (tooltip) {
          tooltip.style.opacity = '1';
          setTimeout(() => {
            tooltip.style.opacity = '0';
          }, 2500);
        }
      }, 500);
      localStorage.setItem('gw_mic_tooltip_shown', 'true');
    }
  }, [isGuestSessionInitialized, guestUuid]);

  const handleLoginClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    console.log('Login successful:', user);
    // The AuthContext will handle the login state
  };

  return (
    <div className="bg-background text-foreground">
      <Header onLoginClick={handleLoginClick} />
      <Hero />
      <InlineInputBar />
      <TrustChips />
      <SocialProof />
      <HowItWorks />
      <FeaturesGrid />
      <ParentsBlock />
      <BoardsSubjects />
      <FAQ />
      <FinalCTA />
      <StickyBottomBar />
      <div className="h-20" /> {/* Bottom padding for sticky bar */}
      <SampleBottomSheet />
      <RoutingSkeleton />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}