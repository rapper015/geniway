'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Mic, Camera } from "lucide-react";

export default function InlineInputBar() {
  const [doubt, setDoubt] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (doubt.trim()) {
      // Store the doubt in localStorage and navigate to chat
      localStorage.setItem('initialDoubt', doubt.trim());
      router.push('/chat');
    }
  };

  const handleSampleClick = (sample) => {
    localStorage.setItem('initialDoubt', sample);
    router.push('/chat');
  };

  return (
    <section className="-mt-6 relative z-10">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-4">
          {/* Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-4">
            {/* Mic Button */}
            <button 
              type="button"
              className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors relative" 
              data-testid="button-mic"
              title="Hold to speak"
              onClick={() => {
                console.log('🎤 Landing page mic button clicked!');
                console.log('🔗 Redirecting to chat app...');
                router.push('/chat');
              }}
            >
              <Mic className="w-5 h-5 text-gray-600" />
              
              {/* Mic Tooltip */}
              <div className="mic-tooltip absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-2 px-3 rounded-lg whitespace-nowrap opacity-0 transition-opacity">
                Hold to speak, release to send
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </button>
            
            {/* Text Input */}
            <input 
              type="text" 
              placeholder="Type your doubt here..."
              className="flex-1 py-3 px-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="input-doubt"
              id="doubtInput"
              value={doubt}
              onChange={(e) => setDoubt(e.target.value)}
            />
            
            {/* Camera Button */}
            <button 
              type="button"
              className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" 
              data-testid="button-camera"
              title="Upload photo"
              onClick={() => router.push('/chat')}
            >
              <Camera className="w-5 h-5 text-gray-600" />
            </button>
          </form>
          
          {/* Starter Chips */}
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-blue-600 hover:text-white transition-colors"
              data-testid="chip-sample-maths"
              onClick={() => handleSampleClick('Class 10 • Trigonometry: Prove that tan θ + cot θ = sec θ cosec θ')}
            >
              Class 10 • Trigonometry
            </button>
            <button 
              className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-blue-600 hover:text-white transition-colors"
              data-testid="chip-sample-physics"
              onClick={() => handleSampleClick('Physics • HC Verma Q5: A ball is thrown vertically upward with speed 20 m/s...')}
            >
              Physics • HC Verma Q5
            </button>
            <button 
              className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-blue-600 hover:text-white transition-colors"
              data-testid="chip-sample-chemistry"
              onClick={() => handleSampleClick('Chemistry • Balancing: Balance the equation: C₂H₄ + O₂ → CO₂ + H₂O')}
            >
              Chemistry • Balancing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
