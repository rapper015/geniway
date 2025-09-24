'use client';

import { useRouter } from 'next/navigation';
import { gtmEvents } from '../lib/gtm';

export default function HowItWorks() {
  const router = useRouter();

  const handleOpenClick = () => {
    // Track CTA click
    gtmEvents.solveDoubtCtaClick('open_the_doubt_solver', 'how_it_works');
    router.push('/chat');
  };

  const steps = [
    {
      number: 1,
      title: "Ask your doubt",
      description: "Type, speak, or upload a photo of your question in English, Hindi, or Hinglish"
    },
    {
      number: 2,
      title: "Get instant help",
      description: "Geni Ma'am understands your question and provides step-by-step solutions"
    },
    {
      number: 3,
      title: "Learn the concept",
      description: "Understand the underlying concepts with detailed explanations and examples"
    }
  ];

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">How it works</h2>
        <div className="space-y-6 mb-8">
          {steps.map((step) => (
            <div key={step.number} className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {step.number}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-colors min-h-[44px]" 
          data-testid="button-open-solver"
          onClick={handleOpenClick}
        >
          Open the doubt solver
        </button>
      </div>
    </section>
  );
}
