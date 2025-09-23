'use client';

import { useRouter } from 'next/navigation';
import { gtmEvents } from '../lib/gtm';

export default function FinalCTA() {
  const router = useRouter();

  const handleStartClick = () => {
    // Track CTA button click
    gtmEvents.solveDoubtCtaClick('start_solving_now', 'final_cta');
    router.push('/chat');
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp share event
    gtmEvents.linkShared('whatsapp', 'final_cta');
    const message = `Hi! I found this amazing AI tutor for solving doubts - Geni Ma'am! 🎓

She can help with:
✅ Math, Science, Social Science
✅ Step-by-step explanations  
✅ Works in English/Hindi/Hinglish
✅ Free during beta!

Try it here: ${window.location.origin}/chat

Perfect for Class 6-12 students! 📚`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-12 bg-blue-600 text-white">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="mb-6">
          <p className="text-white/90 mb-4">Free • No sign-up • English/Hindi</p>
          <h2 className="text-xl font-bold mb-6">Ready to solve your doubts?</h2>
        </div>
        <div className="space-y-3">
          <button 
            className="w-full py-4 bg-white text-blue-600 rounded-2xl font-semibold hover:bg-white/95 transition-colors min-h-[44px]" 
            data-testid="button-start-footer"
            onClick={handleStartClick}
          >
            Start solving now
          </button>
          <button 
            className="w-full py-3 border-2 border-white text-white rounded-2xl font-medium hover:bg-white/10 transition-colors min-h-[44px]" 
            data-testid="button-whatsapp-footer"
            onClick={handleWhatsAppClick}
          >
            Get WhatsApp link
          </button>
        </div>
      </div>
    </section>
  );
}
