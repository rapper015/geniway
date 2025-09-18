'use client';

import { useState, useEffect } from "react";

export default function RoutingSkeleton() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleShowSkeleton = () => setIsActive(true);
    const handleHideSkeleton = () => setIsActive(false);
    
    window.addEventListener('showRoutingSkeleton', handleShowSkeleton);
    window.addEventListener('hideRoutingSkeleton', handleHideSkeleton);
    
    return () => {
      window.removeEventListener('showRoutingSkeleton', handleShowSkeleton);
      window.removeEventListener('hideRoutingSkeleton', handleHideSkeleton);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-900 font-medium">Opening the doubt solver...</p>
      </div>
    </div>
  );
}
