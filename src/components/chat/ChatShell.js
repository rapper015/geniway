'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Settings, 
  History, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import MessageList from './MessageList';
import WhatsAppComposer from './WhatsAppComposer';
import { DEFAULT_QUICK_REPLIES } from './QuickRepliesBar';
import SettingsModal from './SettingsModal';

export default function ChatShell({ subject, onBack }) {
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [mode, setMode] = useState('step-by-step');
  const [userId, setUserId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVisionInput, setShowVisionInput] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [profileStep, setProfileStep] = useState(null); // null, 'name', 'role_grade'
  const [profileData, setProfileData] = useState({});
  const [gotItCount, setGotItCount] = useState(0);
  const [waitingForProfileResponse, setWaitingForProfileResponse] = useState(false);
  const [fastTrackMode, setFastTrackMode] = useState(false);
  const [hideQuickActions, setHideQuickActions] = useState(false);
  const [quizStep, setQuizStep] = useState(null); // null, 'question', 'answer', 'feedback'
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [waitingForQuizResponse, setWaitingForQuizResponse] = useState(false);
  const [quizCompletedForCurrentQuestion, setQuizCompletedForCurrentQuestion] = useState(false);

  // Refs
  const lastCallRef = useRef(null);
  const currentSSERef = useRef(null);
  const messageListRef = useRef(null);

  // Initialize user ID
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserId(user.id);
    } else if (isGuest && guestUser) {
      setUserId(guestUser.id);
    } else {
      // Generate persistent guest UUID
      let guestUuid = localStorage.getItem('guest_uuid');
      if (!guestUuid) {
        guestUuid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('guest_uuid', guestUuid);
      }
      setUserId(guestUuid);
    }
  }, [isAuthenticated, user, isGuest, guestUser]);

  const addWelcomeMessage = useCallback(() => {
    console.log('[ChatShell] addWelcomeMessage called with subject:', subject);
    const subjectMessages = {
      'mathematics': "Hi! I'm Geni Ma'am, your Math tutor. I'm here to help you with all your Math doubts. What would you like to learn today?",
      'science': "Hi! I'm Geni Ma'am, your Science tutor. I'm here to help you with Physics, Chemistry, and Biology. What's your doubt in Science?",
      'social-science': "Hi! I'm Geni Ma'am, your Social Science tutor. I'm here to help you with History, Geography, Civics, and Economics. What would you like to explore?",
      'english': "Hi! I'm Geni Ma'am, your English tutor. I'm here to help you with Literature, Grammar, Writing, and Comprehension. What's your question in English?"
    };

    const welcomeMessage = subjectMessages[subject] || "Hi! I'm Geni Ma'am, your personal tutor. I'm here to help you learn. What would you like to know?";

    const aiMessage = {
      id: `welcome-${Date.now()}`,
      content: welcomeMessage,
      type: 'ai',
      messageType: 'text',
      timestamp: new Date(),
      subject: subject
    };

    console.log('[ChatShell] Setting welcome message:', aiMessage);
    setMessages([aiMessage]);
    setShowOnboarding(false); // Hide onboarding screen to show the welcome message
  }, [subject]);

  // Add subject-specific welcome message immediately when component mounts
  useEffect(() => {
    if (subject && messages.length === 0) {
      console.log('[ChatShell] Adding welcome message for subject:', subject);
      addWelcomeMessage();
    }
  }, [subject, messages.length, addWelcomeMessage]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup SSE connections on unmount
  useEffect(() => {
    return () => {
      if (currentSSERef.current) {
        console.log('[ChatShell] Cleaning up SSE connection on unmount');
        currentSSERef.current.close();
        currentSSERef.current = null;
      }
    };
  }, []);

  // Handle escape key for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showVisionInput) {
          setShowVisionInput(false);
        } else if (isHistoryOpen) {
          setIsHistoryOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showVisionInput, isHistoryOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollToBottom();
    }
  }, [messages]);

  // Generate contextual quiz question based on user's original question
  const generateQuizQuestion = useCallback(async (subject, recentMessages, userQuestion) => {
    try {
      console.log('[ChatShell] Generating contextual quiz for:', { subject, userQuestion });
      
      // Find the user's original question from recent messages
      const originalQuestion = userQuestion || 
        recentMessages.find(msg => msg.type === 'user')?.content || 
        'general topic';
      
      // Call the AI to generate a contextual quiz question
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject,
          originalQuestion: originalQuestion,
          context: recentMessages.slice(-3).map(m => `${m.type}: ${m.content}`).join('\n')
        })
      });

      if (response.ok) {
        const quizData = await response.json();
        console.log('[ChatShell] Generated contextual quiz:', quizData);
        return quizData;
      } else {
        throw new Error('Failed to generate quiz');
      }
    } catch (error) {
      console.error('[ChatShell] Error generating contextual quiz:', error);
      
      // Fallback to simple contextual question
      return {
        question: `Based on your question about "${userQuestion || 'this topic'}", which of the following is most relevant?`,
        options: [
          "The main concept we discussed",
          "A related application", 
          "A common misconception",
          "A practical example"
        ],
        correct: 0,
        explanation: "This relates to the core concept we just covered in your question."
      };
    }
  }, []);

  // Handle message sending with proper session management and error handling
  const handleSendMessage = useCallback(async (text, type = "text", metadata = {}) => {
    console.log('[ChatShell] handleSendMessage called:', { text, type, currentSessionId });
    console.log('[ChatShell] Function called with params:', { text, type, metadata });

    // Handle quiz responses (only if we're actively in quiz mode)
    if (waitingForQuizResponse && quizStep && quizStep !== null) {
      console.log('[ChatShell] Quiz active, handling response:', { text, quizStep, waitingForQuizResponse });
      await handleQuizResponse(text);
      return;
    }

    // Handle profile collection responses (only if we're actively collecting profile data)
    if (waitingForProfileResponse && profileStep && profileStep !== null) {
      console.log('[ChatShell] Profile collection active, handling response:', { text, profileStep, waitingForProfileResponse });
      await handleProfileResponse(text);
      return;
    }
    
    console.log('[ChatShell] Normal message flow:', { text, waitingForProfileResponse, profileStep, isAuthenticated });

    // Hide onboarding when user sends first message
    if (showOnboarding) {
      setShowOnboarding(false);
    }

    // Prevent double execution during any async operation
    if (isStreaming) {
      console.log('[ChatShell] Operation in progress, ignoring duplicate call');
      return;
    }

    // Enhanced duplicate prevention - include session state in key
    const now = Date.now();
    const sessionKey = currentSessionId || 'creating';
    const callKey = `${text}-${type}-${sessionKey}`;
    if (lastCallRef.current && lastCallRef.current.key === callKey && now - lastCallRef.current.time < 3000) {
      console.log('[ChatShell] Duplicate call detected, ignoring');
      return;
    }
    lastCallRef.current = { key: callKey, time: now };

    // Create session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      console.log('[ChatShell] No current session, creating new one...');
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId, 
            subject: subject || detectSubject(text),
            isGuest: !isAuthenticated 
          })
        });
        
        if (response.ok) {
          const session = await response.json();
          sessionId = session.sessionId;
          console.log('[ChatShell] Session created:', { sessionId, session });
          setCurrentSessionId(sessionId);
        } else {
          throw new Error('Failed to create session');
        }
      } catch (error) {
        console.error("Failed to create session:", error);
        return;
      }
    } else {
      console.log('[ChatShell] Using existing session:', sessionId);
    }

    // Add user message immediately to UI for instant feedback
    const tempMessageId = Date.now();
    const userMessage = {
      id: tempMessageId,
      type: 'user',
      content: text,
      timestamp: new Date(),
      messageType: type,
      imageUrl: metadata?.imageUrl
    };

    // Add message to UI immediately
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('[ChatShell] Added user message:', userMessage);
      console.log('[ChatShell] Total messages:', newMessages.length);
      return newMessages;
    });
    
    // Show quick actions again when user sends a message (they will appear after bot responds)
    setHideQuickActions(false);
    
    // Reset quiz completion flag for new question
    setQuizCompletedForCurrentQuestion(false);

    // Stream real AI response from orchestrator
    console.log('[ChatShell] Starting streaming with sessionId:', sessionId);
    streamRealAIResponse(text, type === "image" ? metadata?.imageUrl : undefined, sessionId);
  }, [currentSessionId, isStreaming, showOnboarding, subject, userId, isAuthenticated, waitingForProfileResponse, profileStep, waitingForQuizResponse, quizStep]);

  // Handle profile collection responses
  const handleProfileResponse = useCallback(async (response) => {
    console.log('[ChatShell] handleProfileResponse called:', { response, profileStep, profileData });
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: response.trim(),
      type: 'user',
      messageType: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (profileStep === 'name') {
      console.log('[ChatShell] Processing name step');
      const nameParts = response.trim().split(' ');
      
      if (nameParts.length >= 2) {
        // User provided both first and last name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        const updatedProfile = { ...profileData, firstName, lastName };
        
        // Save name data
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
        // Ask for role directly
        const roleMessage = {
          id: `profile-role-${Date.now()}`,
          content: `Nice to meet you, ${firstName} ${lastName}! Now, are you a student, parent, teacher, or something else?`,
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, roleMessage]);
        setProfileData(updatedProfile);
        setProfileStep('role');
        console.log('[ChatShell] Set profileStep to role (both names provided)');
      } else {
        // User provided only first name
        const firstName = nameParts[0];
        const updatedProfile = { ...profileData, firstName };
        
        // Ask for last name
        const lastNameMessage = {
          id: `profile-lastname-${Date.now()}`,
          content: `Nice to meet you, ${firstName}! What's your last name?`,
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, lastNameMessage]);
        setProfileData(updatedProfile);
        setProfileStep('lastname');
        console.log('[ChatShell] Set profileStep to lastname');
      }
      
    } else if (profileStep === 'lastname') {
      console.log('[ChatShell] Processing lastname step');
      // Extract last name and complete name collection
      const lastName = response.trim();
      const updatedProfile = { ...profileData, lastName };
      
      // Save name data
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Ask for role
      const roleMessage = {
        id: `profile-role-${Date.now()}`,
        content: `Thank you, ${updatedProfile.firstName} ${lastName}! Now, are you a student, parent, teacher, or something else?`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, roleMessage]);
      setProfileData(updatedProfile);
      setProfileStep('role');
      console.log('[ChatShell] Set profileStep to role');
      // Keep waitingForProfileResponse true for the next step
      
    } else if (profileStep === 'role') {
      // Handle role selection
      const role = response.trim().toLowerCase();
      let validRole = 'other';
      
      if (role.includes('student')) validRole = 'student';
      else if (role.includes('parent')) validRole = 'parent';
      else if (role.includes('teacher')) validRole = 'teacher';
      
      const updatedProfile = { ...profileData, role: validRole };
      
      if (validRole === 'student') {
        // Ask for grade
        const gradeMessage = {
          id: `profile-grade-${Date.now()}`,
          content: `Great! What grade or class are you in? (e.g., Class 6, Class 7, etc.)`,
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, gradeMessage]);
        setProfileData(updatedProfile);
        setProfileStep('grade');
      } else {
        // Complete profile for non-students
        await completeProfileCollection(updatedProfile);
      }
      
    } else if (profileStep === 'grade') {
      // Handle grade selection
      const grade = response.trim();
      const updatedProfile = { ...profileData, grade };
      await completeProfileCollection(updatedProfile);
    }
  }, [profileStep, subject, waitingForProfileResponse]);

  // Handle quiz responses
  const handleQuizResponse = useCallback(async (response) => {
    console.log('[ChatShell] handleQuizResponse called:', { response, quizStep, currentQuiz });
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: `I selected option ${response.trim()}`,
      type: 'user',
      messageType: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (quizStep === 'question') {
      // User selected an option (response is already the option number as string)
      const selectedOption = parseInt(response.trim()) - 1; // Convert to 0-based index
      const isCorrect = selectedOption === currentQuiz.correct;
      
      // Show feedback
      const feedbackMessage = {
        id: `quiz-feedback-${Date.now()}`,
        content: isCorrect 
          ? `🎉 Correct! ${currentQuiz.explanation}` 
          : `❌ Not quite right. The correct answer is: ${currentQuiz.explanation}`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, feedbackMessage]);
      
      // Move to profile collection
      setQuizStep(null);
      setWaitingForQuizResponse(false);
      setCurrentQuiz(null);
      setQuizCompletedForCurrentQuestion(true); // Mark quiz as completed for this question
      
      // Start profile collection
      const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      if (!existingProfile.firstName || !existingProfile.lastName) {
        setProfileStep('name');
        setProfileData(existingProfile);
        setWaitingForProfileResponse(true);
        
        const nameMessage = {
          id: `profile-name-${Date.now()}`,
          content: "Great! Now I'd love to know your name so I can personalize our learning experience. What's your first name?",
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, nameMessage]);
      } else {
        // Profile already complete, just thank them
        const thankYouMessage = {
          id: `thank-you-${Date.now()}`,
          content: "Thank you for providing your information! If you have any questions, please ask.",
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, thankYouMessage]);
      }
    }
  }, [quizStep, currentQuiz, subject]);

  // Complete profile collection and create account
  const completeProfileCollection = useCallback(async (finalProfile) => {
    // Save final profile
    localStorage.setItem('guestProfile', JSON.stringify(finalProfile));
    
    // Create account automatically
    try {
      const response = await fetch('/api/auth/auto-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: finalProfile.firstName,
          lastName: finalProfile.lastName,
          role: finalProfile.role,
          grade: finalProfile.grade,
          isGuest: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
            // Success message
            const successMessage = {
              id: `profile-complete-${Date.now()}`,
              content: `Thank you for providing your information, ${finalProfile.firstName}! If you have any questions, please ask.`,
              type: 'ai',
              messageType: 'text',
              timestamp: new Date(),
              subject: subject
            };
            
            setMessages(prev => [...prev, successMessage]);
        
        // Store user data and refresh
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Reset profile collection state
        setProfileStep(null);
        setWaitingForProfileResponse(false);
        setProfileData({});
        
        // Refresh page to update auth state
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      
      // Error message
      const errorMessage = {
        id: `profile-error-${Date.now()}`,
        content: "I've saved your information! You can continue learning now.",
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
    }
  }, [subject]);

  // Stream real AI response from orchestrator API with optimized SSE
  const streamRealAIResponse = useCallback(async (userInput, imageUrl, sessionId) => {
    console.log('[ChatShell] streamRealAIResponse called:', { userInput, sessionId, imageUrl });

    // Prevent multiple streaming calls
    if (isStreaming) {
      console.log('[ChatShell] Already streaming, ignoring duplicate call');
      return;
    }

    // Close any existing SSE connection
    if (currentSSERef.current) {
      console.log('[ChatShell] Closing existing SSE connection');
      currentSSERef.current.close();
      currentSSERef.current = null;
    }

    setIsStreaming(true);

    let currentAIMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: "Geni Ma'am is thinking...",
      timestamp: new Date(),
      messageType: 'text'
    };

    // Add initial AI message to state immediately
    setMessages(prev => [...prev, currentAIMessage]);

    try {
      console.log('[ChatShell] Making solve request with:', { userInput, sessionId, imageUrl });

      // Build URL parameters more safely
      const params = new URLSearchParams();
      params.set('message', userInput);
      if (sessionId) params.set('sessionId', sessionId);
      if (imageUrl) params.set('imageUrl', imageUrl);
      if (userId) params.set('userId', userId);

      const eventSource = new EventSource(`/api/solve?${params.toString()}`);
      currentSSERef.current = eventSource;

      const cleanup = () => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        if (currentSSERef.current === eventSource) {
          currentSSERef.current = null;
        }
        setIsStreaming(false);
        // Show quick actions when streaming is done
        setHideQuickActions(false);
      };

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('[ChatShell] SSE timeout after 60 seconds');
        cleanup();
        if (!currentAIMessage.content || currentAIMessage.content === "Geni Ma'am is thinking...") {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex]?.type === 'ai') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: "I apologize, the response timed out. Please try asking your question again."
              };
            }
            return newMessages;
          });
        }
      }, 60000);

      eventSource.onopen = () => {
        console.log('[ChatShell] SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          if (event.data === '[DONE]') {
            clearTimeout(timeout);
            cleanup();
            return;
          }

          const eventData = JSON.parse(event.data);
          console.log('[ChatShell] SSE event received:', eventData.type, eventData.data);

          if (eventData.type === 'section' && eventData.data?.section) {
            // Handle new scaffolded section
            const section = eventData.data.section;
            const sectionContent = `${section.title}\n\n${section.content}`;

            // Replace the thinking message with this section content
            currentAIMessage = {
              ...currentAIMessage,
              content: sectionContent
            };

            // Update the existing message instead of adding a new one
            setMessages(prev => {
              const newMessages = [...prev];
              const targetIndex = newMessages.findIndex(m => m.id === currentAIMessage.id);
              if (targetIndex >= 0 && targetIndex < newMessages.length) {
                newMessages[targetIndex] = { ...currentAIMessage };
              }
              return newMessages;
            });

          } else if (eventData.type === 'token' && eventData.data?.token) {
            // Handle streaming tokens
            const token = eventData.data.token;
            currentAIMessage = {
              ...currentAIMessage,
              content: currentAIMessage.content === "Geni Ma'am is thinking..."
                ? token
                : currentAIMessage.content + token
            };

            // Update message in state
            setMessages(prev => {
              const newMessages = [...prev];
              const targetIndex = newMessages.findIndex(m => m.id === currentAIMessage.id);
              if (targetIndex >= 0 && targetIndex < newMessages.length) {
                newMessages[targetIndex] = { ...currentAIMessage };
              }
              return newMessages;
            });

          } else if (eventData.type === 'final' || eventData.type === 'done') {
            clearTimeout(timeout);
            cleanup();
            // Show quick actions when response is completely done
            setHideQuickActions(false);
          } else if (eventData.type === 'error') {
            clearTimeout(timeout);
            cleanup();
            console.error('[ChatShell] Server error:', eventData.data);
            // Show quick actions even on error
            setHideQuickActions(false);
            // Update the current message with error
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (newMessages[lastIndex]?.type === 'ai') {
                newMessages[lastIndex] = {
                  ...newMessages[lastIndex],
                  content: eventData.data?.error || "I encountered an error processing your question. Please try again."
                };
              }
              return newMessages;
            });
          }
        } catch (e) {
          console.warn('Failed to parse SSE event:', event.data, e);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        clearTimeout(timeout);
        cleanup();
        // Show quick actions even on error
        setHideQuickActions(false);

        // Show appropriate error message based on connection state
        const errorMessage = currentAIMessage.content && currentAIMessage.content !== "Geni Ma'am is thinking..."
          ? "Connection was interrupted, but I managed to provide a partial response above."
          : "I apologize, but I'm having trouble processing your request right now. Please try again.";

        if (!currentAIMessage.content || currentAIMessage.content === "Geni Ma'am is thinking...") {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex]?.type === 'ai') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: errorMessage
              };
            }
            return newMessages;
          });
        }
      };

      // Cleanup on component unmount
      return cleanup;

    } catch (error) {
      console.error('Streaming setup error:', error);
      setIsStreaming(false);

      // Show error message
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        if (newMessages[lastIndex]?.type === 'ai') {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: "I apologize, but I encountered an error. Please try again."
          };
        }
        return newMessages;
      });
    }
  }, [isStreaming, fastTrackMode, subject, userId]);

  // Handle quick reply actions
  const handleQuickReplyClick = useCallback((action) => {
    console.log('Quick reply action:', action);

    // Hide quick actions immediately when any option is clicked
    setHideQuickActions(true);

    // Handle fast track mode toggle
    if (action === 'fast_track_mode') {
      setFastTrackMode(!fastTrackMode);
      const message = fastTrackMode ? 'Switch back to step-by-step mode' : 'Switch to fast-track mode';
      handleSendMessage(message, "text");
      return;
    }

    // Find the message that corresponds to this action
    const reply = DEFAULT_QUICK_REPLIES.find(r => r.action === action);
    if (!reply) {
      console.warn('Unknown quick reply action:', action);
      return;
    }

    // Send the predefined message
    handleSendMessage(reply.message, "text");

    // Trigger progressive profile collection for guest users on "Got it"
    if (action === 'confirm_understanding' && !isAuthenticated) {
      handleGotItClick();
    }
  }, [handleSendMessage, isAuthenticated, fastTrackMode]);

  // Handle "Got it" clicks for quiz and progressive profile collection
  const handleGotItClick = useCallback(async () => {
    console.log('[ChatShell] handleGotItClick called:', { gotItCount, isAuthenticated });
    const newGotItCount = gotItCount + 1;
    setGotItCount(newGotItCount);

    // Check existing profile data
    const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
    
    // Only show quiz if not already completed for current question (for guest users)
    if (!isAuthenticated && !quizCompletedForCurrentQuestion) {
      // Find the user's original question from recent messages
      const userQuestion = messages.find(msg => msg.type === 'user')?.content;
      
      // Generate contextual quiz question
      const quiz = await generateQuizQuestion(subject, messages, userQuestion);
      setCurrentQuiz(quiz);
      setQuizStep('question');
      setWaitingForQuizResponse(true);
      
      // Create quiz message with options
      const quizMessage = {
        id: `quiz-${Date.now()}`,
        content: `**❓ Quick Check**\n\nGreat! Let me test your understanding with a quick question:\n\n**${quiz.question}**`,
        type: 'ai',
        messageType: 'quiz',
        timestamp: new Date(),
        subject: subject,
        quizData: {
          question: quiz.question,
          options: quiz.options,
          correct: quiz.correct,
          explanation: quiz.explanation
        }
      };
      
      setMessages(prev => [...prev, quizMessage]);
    } else {
      // For authenticated users or if quiz already completed, just acknowledge
      const ackMessage = {
        id: `ack-${Date.now()}`,
        content: "Great! If you have any more questions, feel free to ask!",
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, ackMessage]);
    }
  }, [gotItCount, subject, isAuthenticated, generateQuizQuestion, messages, quizCompletedForCurrentQuestion]);


  // Handle voice input
  const handleVoiceRecording = useCallback(async (audioBlob) => {
    // Simulate voice transcript
    const transcript = "This is a simulated transcript from voice input";
    handleSendMessage(transcript, "voice");
  }, [handleSendMessage]);

  // Handle image upload
  const handleImageUpload = useCallback(() => {
    setShowVisionInput(true);
  }, []);

  // Handle vision input completion
  const handleVisionComplete = useCallback((result) => {
    console.log('Vision upload result:', result);
    const content = result.ocrText || 'Image processed successfully';
    const messageWithImage = {
      content,
      imageUrl: result.url,
      type: "image"
    };
    handleSendMessage(content, "image", messageWithImage);
    setShowVisionInput(false);
  }, [handleSendMessage]);

  // Handle vision error
  const handleVisionError = useCallback((error) => {
    console.error('Vision upload error:', error);
    setShowVisionInput(false);
  }, []);

  // Handle MCQ option selection (including quiz options)
  const handleMCQOptionClick = useCallback((selectedOption, questionText) => {
    console.log('MCQ option selected:', selectedOption, 'for question:', questionText);
    
    // Check if we're in quiz mode
    if (waitingForQuizResponse && quizStep === 'question' && currentQuiz) {
      // Handle quiz response
      handleQuizResponse(selectedOption);
    } else {
      // Handle regular MCQ
      handleSendMessage(`I selected option ${selectedOption.toUpperCase()}`, "text");
    }
  }, [handleSendMessage, waitingForQuizResponse, quizStep, currentQuiz, handleQuizResponse]);

  // Handle retry from queue
  const handleRetryMessage = useCallback((item) => {
    setFailedMessages(prev =>
      prev.map(msg =>
        msg.id === item.id
          ? { ...msg, attempts: msg.attempts + 1 }
          : msg
      )
    );

    // Remove from failed queue on retry
    setTimeout(() => {
      setFailedMessages(prev => prev.filter(msg => msg.id !== item.id));
    }, 100);

    handleSendMessage(item.content, item.type);
  }, [handleSendMessage]);

  // Handle discard from retry queue
  const handleDiscardMessage = useCallback((id) => {
    setFailedMessages(prev => prev.filter(item => item.id !== id));
  }, []);

  // Handle back button click
  const handleBackClick = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  }, [onBack]);


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 fixed top-0 w-full z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="h-8 w-8 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.99] focus:ring-2 focus:ring-white/20 focus:ring-offset-1 transition-all duration-200 ease-in-out shadow-sm rounded-lg flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">G</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">GeniWay</h1>
              <p className="text-sm text-white/80">AI Doubt Solver</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Network status */}
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              isOnline
                ? "bg-white/20 text-white"
                : "bg-red-500/20 text-red-100"
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Online" : "Offline"}
            </div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="h-8 w-8 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.99] focus:ring-2 focus:ring-white/20 focus:ring-offset-1 transition-all duration-200 ease-in-out shadow-sm rounded-lg flex items-center justify-center"
            >
              <History className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="h-8 w-8 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-[0.99] focus:ring-2 focus:ring-white/20 focus:ring-offset-1 transition-all duration-200 ease-in-out shadow-sm rounded-lg flex items-center justify-center"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative pt-20 pb-32">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onRetry={(messageId) => {
            const message = messages.find(m => m.id === messageId);
            if (message) {
              const retryItem = {
                id: messageId.toString(),
                content: message.content || '',
                type: message.messageType || 'text',
                attempts: 1,
              };
              handleRetryMessage(retryItem);
            }
          }}
          onMCQOptionClick={handleMCQOptionClick}
          onQuickReplyClick={handleQuickReplyClick}
          fastTrackMode={fastTrackMode}
          hideQuickActions={hideQuickActions}
          className="pt-20 pb-20"
          ref={messageListRef}
          showOnboarding={showOnboarding}
        />


        {/* WhatsApp-style Composer */}
        <WhatsAppComposer
          onSendMessage={handleSendMessage}
          onImageUpload={handleImageUpload}
          onVoiceTranscript={(text) => handleSendMessage(text, "voice")}
          disabled={isStreaming || !isOnline}
          isOnline={isOnline}
        />
        
        {/* Debug info */}
        <div className="fixed bottom-0 right-0 bg-black text-white p-2 text-xs">
          Debug: isStreaming={isStreaming.toString()}, isOnline={isOnline.toString()}, disabled={(isStreaming || !isOnline).toString()}<br/>
          Profile: waiting={waitingForProfileResponse.toString()}, step={profileStep}, isAuth={isAuthenticated.toString()}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

    </div>
  );
}

// Helper functions
function detectSubject(content) {
  const mathKeywords = ["equation", "solve", "calculate", "algebra", "geometry", "calculus"];
  const scienceKeywords = ["physics", "chemistry", "biology", "experiment", "formula"];

  const contentLower = content.toLowerCase();

  if (mathKeywords.some(keyword => contentLower.includes(keyword))) {
    return "Mathematics";
  }
  if (scienceKeywords.some(keyword => contentLower.includes(keyword))) {
    return "Science";
  }

  return "General";
}
