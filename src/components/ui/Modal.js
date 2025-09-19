'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true 
}) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      
      {/* Modal content */}
      <div className={`
        relative w-full ${sizeClasses[size]} max-h-[90vh] 
        bg-white/95 backdrop-blur-md
        rounded-2xl shadow-2xl border border-white/20
        transform transition-all duration-300 ease-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        overflow-hidden
      `}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100/80 rounded-full transition-colors duration-200 group"
              >
                <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal Header Component
export function ModalHeader({ children, className = '' }) {
  return (
    <div className={`p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

// Modal Body Component
export function ModalBody({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

// Modal Footer Component
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}
