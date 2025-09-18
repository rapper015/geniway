'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function FinalCTA() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartClick = () => {
    router.push('/chat');
  };

  const handleWhatsAppClick = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('WhatsApp link generated');
      alert('WhatsApp link generated! (Demo)');
    } catch (error) {
      console.error('Failed to generate WhatsApp link:', error);
      alert('Failed to generate WhatsApp link');
    } finally {
      setIsLoading(false);
    }
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
            className="w-full py-3 border-2 border-white text-white rounded-2xl font-medium hover:bg-white/10 transition-colors min-h-[44px] disabled:opacity-50" 
            data-testid="button-whatsapp-footer"
            onClick={handleWhatsAppClick}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Get WhatsApp link"}
          </button>
        </div>
      </div>
    </section>
  );
}
