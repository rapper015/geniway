'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { gtmEvents } from '../lib/gtm';

export default function Header({ onLoginClick }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  const handleStartClick = () => {
    // Track CTA click
    gtmEvents.solveDoubtCtaClick('start', 'header');
    router.push('/chat');
  };


  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {/* <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">GeniWay</span> */}
          <img src="/logo.png" alt="GeniWay" className="w-28" />
        </div>
        
        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Login Button - only show if not authenticated */}
          {!isAuthenticated && (
            <button 
              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors" 
              onClick={onLoginClick}
            >
              Login
            </button>
          )}
          
          {/* User Profile - only show if authenticated */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Hi, {user.name}</span>
            </div>
          )}
          
          {/* Start Button */}
          <button 
            className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] min-w-[60px]" 
            data-testid="button-start-header"
            onClick={handleStartClick}
          >
            Start
          </button>
        </div>
      </div>
    </header>
  );
}