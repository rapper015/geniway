'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ChatShell from '../../../components/chat/ChatShell';
import { Loader2 } from 'lucide-react';

function EnhancedChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get subject from URL params
    const subjectParam = searchParams.get('subject');
    if (subjectParam) {
      setSubject(subjectParam);
    } else {
      // Default to general if no subject specified
      setSubject('general');
    }
    setIsLoading(false);
  }, [searchParams]);

  const handleBack = () => {
    router.push('/chat');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ChatShell 
        subject={subject}
        onBack={handleBack}
      />
    </div>
  );
}

export default function EnhancedChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading chat interface...</p>
        </div>
      </div>
    }>
      <EnhancedChatContent />
    </Suspense>
  );
}
