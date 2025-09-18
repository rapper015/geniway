'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const [showSampleSheet, setShowSampleSheet] = useState(false);

  const handleStartClick = () => {
    router.push('/chat');
  };

  const handleSampleClick = () => {
    setShowSampleSheet(true);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-br from-blue-600 to-cyan-500">
        <div className="max-w-md mx-auto px-4 pt-8 pb-12 text-center text-white">
          <h1 className="text-2xl font-bold mb-3 leading-tight">
            Doubt hai? Geni Ma'am se poochho.
          </h1>
          <p className="text-white/90 mb-8 leading-relaxed">
            Step-by-step help in English/Hindi. Free during beta. No sign-up. No OTP.
          </p>
          
          {/* Primary CTAs */}
          <div className="space-y-3 mb-8">
            <button 
              className="w-full py-4 bg-white text-blue-600 rounded-2xl font-semibold text-lg hover:bg-white/95 transition-colors min-h-[44px]" 
              data-testid="button-start-hero"
              onClick={handleStartClick}
            >
              Start solving my doubt
            </button>
            <button 
              className="w-full py-3 border-2 border-white text-white rounded-2xl font-medium hover:bg-white/10 transition-colors min-h-[44px]" 
              data-testid="button-sample"
              onClick={handleSampleClick}
            >
              Try a sample
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}