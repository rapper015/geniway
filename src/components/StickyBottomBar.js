'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { gtmEvents } from '../lib/gtm';

export default function StickyBottomBar() {
  const router = useRouter();
  const { changeLanguage } = useLanguage();

  const handleHoldToSpeak = () => {
    router.push('/chat');
  };

  const handleHindiClick = () => {
    // Track CTA click
    gtmEvents.solveDoubtCtaClick('hindi_mein_poochho', 'sticky_bottom_bar');
    
    // Set language to Hindi and navigate to chat
    changeLanguage('hindi');
    router.push('/chat');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-4">
      <div className="max-w-md mx-auto flex gap-3">
        {/* <button 
          className="flex-1 py-3 border border-blue-600 text-blue-600 rounded-2xl font-medium hover:bg-blue-50 transition-colors min-h-[44px]" 
          data-testid="button-hold-to-speak"
          onClick={handleHoldToSpeak}
        >
          Hold to speak →
        </button> */}
        <button 
          className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-medium hover:bg-blue-700 transition-colors min-h-[44px]" 
          data-testid="button-hindi"
          onClick={handleHindiClick}
        >
          हिंदी में पूछें →
        </button>
      </div>
    </div>
  );
}