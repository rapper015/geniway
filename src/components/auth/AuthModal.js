'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAuthSuccess = (user) => {
    onAuthSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full mx-auto ${
          isLoginMode ? 'max-w-md' : 'max-w-lg'
        }`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className={`p-8 ${!isLoginMode ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
            {isLoginMode ? (
              <LoginForm 
                onToggleMode={() => setIsLoginMode(false)}
                onLogin={handleAuthSuccess}
              />
            ) : (
              <RegisterForm 
                onToggleMode={() => setIsLoginMode(true)}
                onRegister={handleAuthSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
