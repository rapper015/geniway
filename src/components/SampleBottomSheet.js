'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';

export default function SampleBottomSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const samples = [
    {
      id: "maths_trigo",
      title: "Class 10 • Trigonometry",
      description: "Prove that tan θ + cot θ = sec θ cosec θ"
    },
    {
      id: "physics_hcv_q5",
      title: "Physics • HC Verma Q5", 
      description: "A ball is thrown vertically upward with speed 20 m/s..."
    },
    {
      id: "chem_balancing",
      title: "Chemistry • Balancing",
      description: "Balance the equation: C₂H₄ + O₂ → CO₂ + H₂O"
    }
  ];

  const handleSampleClick = (sampleId) => {
    setIsOpen(false);
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      localStorage.setItem('initialDoubt', `${sample.title}: ${sample.description}`);
      router.push('/chat');
    }
  };

  // Listen for global sample sheet events
  useEffect(() => {
    const handleOpenSampleSheet = () => setIsOpen(true);
    window.addEventListener('openSampleSheet', handleOpenSampleSheet);
    return () => window.removeEventListener('openSampleSheet', handleOpenSampleSheet);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
      <div 
        className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-gray-200 shadow-2xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-md mx-auto">
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Content */}
          <div className="p-6 pb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Pick a sample</h3>
            <div className="space-y-3">
              {samples.map((sample) => (
                <button 
                  key={sample.id}
                  className="w-full p-4 text-left border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
                  data-testid={`sample-option-${sample.id}`}
                  onClick={() => handleSampleClick(sample.id)}
                >
                  <div className="font-medium text-gray-900">{sample.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{sample.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
