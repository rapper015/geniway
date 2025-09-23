'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useProfileCollection } from '../../contexts/ProfileCollectionContext';
import { 
  ArrowLeft, 
  Settings, 
  History, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import MessageList from './MessageList';
import WhatsAppComposer from './WhatsAppComposer';
import VisionInputModal from './VisionInputModal';
import SettingsModal from './SettingsModal';
import { ProfileCollectionWrapper } from '../ProfileCollectionWrapper';
import { StepWiseProfileWrapper } from '../StepWiseProfileWrapper';
import { gtmEvents } from '../../lib/gtm';
import { getQuickReplies } from './QuickRepliesBar';

export default function ChatShell({ subject, onBack }) {
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  const { language } = useLanguage();
  const { triggerProfileCollection, triggerStepModal, setOnStepComplete, currentStep } = useProfileCollection();
  
  // State management
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

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
          email: finalProfile.email, // Added email
          password: finalProfile.password,
          role: finalProfile.role,
          grade: finalProfile.grade,
          board: finalProfile.board || 'CBSE',
          subjects: finalProfile.subjects || [],
          learningStyle: finalProfile.learningStyle || 'Text',
          learningStyles: finalProfile.learningStyles || ['Text'],
          pace: finalProfile.pace || 'Normal',
          state: finalProfile.state || '',
          city: finalProfile.city || '',
          teachingLanguage: language || 'English',
          contentMode: 'step-by-step',
          fastTrackEnabled: false,
          saveChatHistory: true,
          studyStreaksEnabled: true,
          breakRemindersEnabled: true,
          masteryNudgesEnabled: true,
          dataSharingEnabled: false,
          isGuest: false // Now creating a real account
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
        
        // Mark account as created in profile
        const updatedProfile = { ...finalProfile, accountCreated: true };
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
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
        content: "Sorry, there was an error creating your account. You can continue using the chat as a guest.",
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

  // Acknowledgment callback for step completion
  const handleStepComplete = useCallback(async (step, data) => {
    
    // Only send acknowledgment if we have a valid step
    if (!step || step === null || step === undefined) {
      return;
    }

    const getAcknowledgmentMessage = (step, data) => {
      switch (step) {
        case 'name':
          const name = data.firstName || data.name || 'there';
          return `Thank you for sharing your name, ${name}! I'm excited to help you learn. Feel free to ask me any questions!`;
        
        case 'role_grade':
          const role = data.role === 'student' ? 'student' : data.role === 'parent' ? 'parent' : 'teacher';
          return `Great! I understand you're a ${role}. I'll tailor my explanations accordingly. What would you like to learn about?`;
        
        case 'grade':
          return `Perfect! Grade ${data.grade} is an exciting time for learning. I'll make sure to provide age-appropriate explanations. Ask me anything!`;
        
        case 'board':
          return `Excellent! I'll keep the ${data.board} curriculum in mind when helping you. What subject would you like to explore?`;
        
        case 'subjects':
          const subjects = Array.isArray(data.subjects) ? data.subjects.join(', ') : data.subjects;
          return `Wonderful! I see you're interested in ${subjects}. I'll focus on these areas when helping you. What would you like to know?`;
        
        case 'learning_style':
          return `Perfect! I'll present information in a ${data.learningStyle} way that works best for you. Feel free to ask me any questions!`;
        
        case 'pace':
          return `Great! I'll provide ${data.pace} explanations that match your learning pace. What would you like to learn about?`;
        
        case 'location':
          return `Thanks for sharing! I'll keep ${data.state} in mind for relevant examples. What can I help you with today?`;
        
        case 'email': // Added
          return `Perfect! Your email has been saved. Now let's set up a password for your account.`;
        
        case 'password':
          // Don't send acknowledgment message, we'll trigger complete step automatically
          return null;
        
        case 'complete':
          // For complete step, we'll handle account creation in the callback
          return null; // Don't send acknowledgment message, account creation will handle it
        
        default:
          return null; // Don't send message for unknown steps
      }
    };

    // Handle password step - automatically trigger complete step
    if (step === 'password') {
      // Get the updated profile with password
      const updatedProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      
      // Trigger complete step immediately
      setTimeout(() => {
        triggerStepModal('complete', updatedProfile);
      }, 500); // Small delay to ensure password is saved
      return;
    }

    // Handle complete step separately (account creation)
    if (step === 'complete') {
      try {
        await completeProfileCollection(data);
      } catch (error) {
        console.error('[ChatShell] Error creating account:', error);
        // Add error message
        const errorMessage = {
          id: `error-${Date.now()}`,
          content: "Sorry, there was an error creating your account. You can continue using the chat as a guest.",
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }

    const messageContent = getAcknowledgmentMessage(step, data);
    if (!messageContent) {
      return; // Don't send message if content is null
    }

    const acknowledgmentMessage = {
      id: `ack-${step}-${Date.now()}`,
      content: messageContent,
      type: 'ai',
      messageType: 'text',
      timestamp: new Date(),
      subject: subject
    };

    setMessages(prev => [...prev, acknowledgmentMessage]);
  }, [subject, completeProfileCollection]);

  // Set up the step completion callback
  useEffect(() => {
    setOnStepComplete(handleStepComplete);
  }, [setOnStepComplete, handleStepComplete]);

  // Debug: Log when complete step modal is triggered
  useEffect(() => {
    if (currentStep === 'complete') {
    }
  }, [currentStep]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (parsedMessages.length > 0) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error('[ChatShell] Error loading messages from localStorage:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatHistory', JSON.stringify(messages));
    }
  }, [messages]);
  const [mode, setMode] = useState('step-by-step');
  const [userId, setUserId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
  const [showVisionInput, setShowVisionInput] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsRefreshKey, setSettingsRefreshKey] = useState(0);
  const [profileStep, setProfileStep] = useState(null); // null, 'name', 'role_grade'
  const [profileData, setProfileData] = useState(() => {
    // Initialize with existing localStorage data
    const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
    return existingProfile;
  });
  
  // Debug: Log profile data changes
  useEffect(() => {
  }, [profileData]);
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
      // Use user._id if available (from database), otherwise use user.id
      const userIdToSet = user._id || user.id;
      setUserId(userIdToSet);
    } else if (isGuest && guestUser) {
      setUserId(guestUser.id);
    } else {
      // Check if user data exists in localStorage (after account creation)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          const userIdToSet = userData._id || userData.id;
          setUserId(userIdToSet);
        } catch (error) {
          console.error('[ChatShell] Error parsing stored user:', error);
        }
      }
      
      // Generate persistent guest UUID if no user data
      let guestUuid = localStorage.getItem('guest_uuid');
      if (!guestUuid) {
        guestUuid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('guest_uuid', guestUuid);
      }
      setUserId(guestUuid);
    }
  }, [isAuthenticated, user, isGuest, guestUser]);

  const addWelcomeMessage = useCallback(() => {
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

    setMessages([aiMessage]);
    setShowOnboarding(false); // Hide onboarding screen to show the welcome message
  }, [subject]);

  // Add subject-specific welcome message immediately when component mounts
  useEffect(() => {
    if (subject && messages.length === 0) {
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

  // Debug: Log state changes
  useEffect(() => {
  }, [hideQuickActions, isStreaming, messages]);

  // Generate contextual quiz question based on AI's response content
  const generateQuizQuestion = useCallback(async (subject, recentMessages, originalUserQuestion) => {
    try {
      
      // Find the AI's response content from recent messages
      const aiResponse = recentMessages.find(msg => msg.type === 'ai' && msg.content);
      const userQuestion = recentMessages.find(msg => msg.type === 'user')?.content || originalUserQuestion || 'general topic';
      
      
      if (!aiResponse) {
        console.warn('[ChatShell] No AI response found for quiz generation');
        // Return a fallback quiz based on user question
        return {
          question: `Based on your question about "${userQuestion}", which of the following is most relevant?`,
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
      
      
      // Call the AI to generate a contextual quiz question based on the AI's response
      const requestBody = {
        subject: subject,
        originalQuestion: userQuestion,
        aiResponse: aiResponse.content, // Pass the AI's actual response
        context: recentMessages.slice(-3).map(m => `${m.type}: ${m.content}`).join('\n')
      };
      
      
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      
      if (response.ok) {
        const quizData = await response.json();
        return quizData;
      } else {
        const errorText = await response.text();
        console.error('[ChatShell] Quiz generation failed:', response.status, response.statusText, errorText);
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

    // Track chat message sent event
    gtmEvents.chatMessageSent(type, currentSessionId, userId);
    
    // Track chat session start event for first message
    if (messages.length === 0) {
      const profileId = isAuthenticated ? user?.id || user?._id : guestUser?.id;
      gtmEvents.chatSessionStart(profileId, currentSessionId);
    }

    // Handle quiz responses (only if we're actively in quiz mode)
    if (waitingForQuizResponse && quizStep && quizStep !== null) {
      await handleQuizResponse(text);
      return;
    }

    // Handle profile collection responses (only if we're actively collecting profile data)
    if (waitingForProfileResponse && profileStep && profileStep !== null) {
      await handleProfileResponse(text);
      return;
    }
    

    // Hide onboarding when user sends first message
    if (showOnboarding) {
      setShowOnboarding(false);
    }

    // Prevent double execution during any async operation
    if (isStreaming) {
      return;
    }

    // Enhanced duplicate prevention - include session state in key
    const now = Date.now();
    const sessionKey = currentSessionId || 'creating';
    const callKey = `${text}-${type}-${sessionKey}`;
    if (lastCallRef.current && lastCallRef.current.key === callKey && now - lastCallRef.current.time < 3000) {
      return;
    }
    lastCallRef.current = { key: callKey, time: now };

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

    // Add message to UI immediately - this happens first for instant feedback
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      return newMessages;
    });
    
    // Show quick actions again when user sends a message (they will appear after bot responds)
    setHideQuickActions(false);
    
    // Reset quiz completion flag for new question
    setQuizCompletedForCurrentQuestion(false);

    // Handle session creation in background - don't block UI
    let sessionId = currentSessionId;
    if (!sessionId) {
      
      // Create session asynchronously without blocking UI
      const createSession = async () => {
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
            setCurrentSessionId(sessionId);
            
            // Start streaming after session is created
            streamRealAIResponse(text, type === "image" ? metadata?.imageUrl : undefined, sessionId);
          } else {
            throw new Error('Failed to create session');
          }
        } catch (error) {
          console.error("Failed to create session:", error);
          // Show error message to user
          const errorMessage = {
            id: Date.now() + 2,
            type: 'ai',
            content: "I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date(),
            messageType: 'text'
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsStreaming(false);
        }
      };
      
      // Start session creation in background
      createSession();
    } else {
      // Stream real AI response from orchestrator immediately
      streamRealAIResponse(text, type === "image" ? metadata?.imageUrl : undefined, sessionId);
    }
  }, [currentSessionId, isStreaming, showOnboarding, subject, userId, isAuthenticated, waitingForProfileResponse, profileStep, waitingForQuizResponse, quizStep]);

  // Update user profile in local state (no API calls for now)
  const updateUserProfile = useCallback((profileData) => {
    // Update local profile state
    setProfileData(prev => {
      const newProfileData = {
        ...prev,
        ...profileData
      };
      
      // Also update localStorage immediately
      localStorage.setItem('guestProfile', JSON.stringify(newProfileData));
      
      return newProfileData;
    });
    
    // Trigger settings modal refresh
    setSettingsRefreshKey(prev => prev + 1);
  }, []);


  // Handle profile collection responses
  const handleProfileResponse = useCallback(async (response) => {
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: response.trim(),
      type: 'user',
      messageType: 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (profileStep === 'name') {
      const nameParts = response.trim().split(' ');
      
      if (nameParts.length >= 2) {
        // User provided both first and last name
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        const updatedProfile = { ...profileData, firstName, lastName };
        
        // Save name data and encourage user to ask another question
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
        // Update user profile in local state
        updateUserProfile({
          firstName: firstName,
          lastName: lastName,
          name: `${firstName} ${lastName}`
        });
        
        const thankYouMessage = {
          id: `profile-name-thanks-${Date.now()}`,
          content: `Nice to meet you, ${firstName} ${lastName}! Feel free to ask me any other doubt in this subject!`,
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, thankYouMessage]);
        setProfileStep(null);
        setWaitingForProfileResponse(false);
        setProfileData({});
      } else {
        // User provided only first name
        const firstName = nameParts[0];
        const updatedProfile = { ...profileData, firstName };
        
        // Save first name and encourage user to ask another question
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
        // Update user profile in local state
        updateUserProfile({
          firstName: firstName,
          name: firstName
        });
        
        const thankYouMessage = {
          id: `profile-name-thanks-${Date.now()}`,
          content: `Nice to meet you, ${firstName}! Feel free to ask me any other doubt in this subject!`,
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, thankYouMessage]);
        setProfileStep(null);
        setWaitingForProfileResponse(false);
        setProfileData({});
      }
      
    } else if (profileStep === 'role_grade') {
      // Handle role selection
      const role = response.trim().toLowerCase();
      let validRole = 'other';
      
      if (role.includes('student')) validRole = 'student';
      else if (role.includes('parent')) validRole = 'parent';
      else if (role.includes('teacher')) validRole = 'teacher';
      
      const updatedProfile = { ...profileData, role: validRole };
      
      // Save the role and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        role: validRole
      });
      
      const thankYouMessage = {
        id: `profile-role-thanks-${Date.now()}`,
        content: `Thank you! I've noted that you're a ${validRole}. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'grade') {
      // Handle grade selection
      const grade = response.trim();
      const updatedProfile = { ...profileData, grade };
      
      // Save the grade and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        grade: parseInt(grade)
      });
      
      const thankYouMessage = {
        id: `profile-grade-thanks-${Date.now()}`,
        content: `Perfect! I've noted that you're in grade ${grade}. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'board') {
      // Handle board selection
      const board = response.trim();
      const updatedProfile = { ...profileData, board };
      
      // Save the board and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        board: board
      });
      
      const thankYouMessage = {
        id: `profile-board-thanks-${Date.now()}`,
        content: `Great! I've noted that you're studying under ${board}. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'subjects') {
      // Handle subjects selection
      const subjectsText = response.trim();
      // Parse subjects from the response
      const subjects = subjectsText.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
      const updatedProfile = { ...profileData, subjects };
      
      // Save the subjects and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        subjects: subjects
      });
      
      const thankYouMessage = {
        id: `profile-subjects-thanks-${Date.now()}`,
        content: `Excellent! I've noted your interest in: ${subjects.join(', ')}. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'learning_style') {
      // Handle learning style selection
      const learningStyle = response.trim().toLowerCase();
      let validStyle = 'Text';
      
      if (learningStyle.includes('visual')) validStyle = 'Visual';
      else if (learningStyle.includes('voice') || learningStyle.includes('audio') || learningStyle.includes('listening')) validStyle = 'Voice';
      else if (learningStyle.includes('hands') || learningStyle.includes('doing') || learningStyle.includes('activities')) validStyle = 'Kinesthetic';
      
      const updatedProfile = { ...profileData, learningStyle, learningStyles: [validStyle] };
      
      // Save the learning style and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        learningStyle: validStyle,
        learningStyles: [validStyle]
      });
      
      const thankYouMessage = {
        id: `profile-learning-style-thanks-${Date.now()}`,
        content: `Perfect! I've noted that you prefer ${validStyle} learning. I'll tailor my explanations accordingly. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'pace') {
      // Handle pace selection
      const pace = response.trim().toLowerCase();
      let validPace = 'Normal';
      
      if (pace.includes('fast') || pace.includes('quick')) validPace = 'Fast';
      else if (pace.includes('detailed') || pace.includes('thorough')) validPace = 'Detailed';
      
      const updatedProfile = { ...profileData, pace };
      
      // Save the pace and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        pace: validPace
      });
      
      const thankYouMessage = {
        id: `profile-pace-thanks-${Date.now()}`,
        content: `Great! I've noted that you prefer ${validPace} pace learning. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'location') {
      // Handle location selection
      const state = response.trim();
      const updatedProfile = { ...profileData, state };
      
      // Save the location and encourage user to ask another question
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // Update user profile in local state
      updateUserProfile({
        state: state
      });
      
      const thankYouMessage = {
        id: `profile-location-thanks-${Date.now()}`,
        content: `Excellent! I've noted that you're from ${state}. This will help me provide more relevant examples. Feel free to ask me any other doubt in this subject!`,
        type: 'ai',
        messageType: 'text',
        timestamp: new Date(),
        subject: subject
      };
      
      setMessages(prev => [...prev, thankYouMessage]);
      setProfileStep(null);
      setWaitingForProfileResponse(false);
      setProfileData({});
      
    } else if (profileStep === 'complete') {
      // Complete profile collection and auto-register
      const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      await completeProfileCollection(existingProfile);
    }
  }, [profileStep, subject, waitingForProfileResponse, completeProfileCollection, updateUserProfile]);

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
      
      // Track quiz completion
      const quizScore = isCorrect ? 1 : 0; // 1 for correct, 0 for incorrect
      gtmEvents.quizCompleted(currentQuiz?.id || 'unknown', quizScore, currentSessionId);
      
      // Check if we should ask for profile info based on gotItCount
      const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      const shouldAskProfile = shouldAskForProfileInfo(gotItCount, existingProfile);
      
      // Trigger step-wise modal if needed with delay
      if (shouldAskProfile.ask) {
        // Add delay before showing profile popup
        setTimeout(() => {
          triggerStepModal(shouldAskProfile.step, existingProfile);
        }, 2000); // 2 second delay
      } else {
        // Encourage user to ask another question
        const encourageMessage = {
          id: `encourage-${Date.now()}`,
          content: "Great! Feel free to ask me any other doubt in this subject!",
          type: 'ai',
          messageType: 'text',
          timestamp: new Date(),
          subject: subject
        };
        
        setMessages(prev => [...prev, encourageMessage]);
      }
    }
  }, [quizStep, currentQuiz, subject, gotItCount]);

  // Check if profile is complete in localStorage
  const isProfileComplete = useCallback((profile) => {
    console.log('[ChatShell] Checking profile completion:', profile);
    
    // Base required fields for all roles
    const baseRequiredFields = ['firstName', 'role', 'board', 'subjects', 'learningStyle', 'pace', 'state'];
    
    // Check base fields
    const baseComplete = baseRequiredFields.every(field => {
      if (field === 'subjects') {
        return profile[field] && Array.isArray(profile[field]) && profile[field].length > 0;
      }
      return profile[field] && profile[field].toString().trim() !== '';
    });
    
    // For students, also require grade
    if (profile.role === 'student') {
      const gradeComplete = profile.grade && profile.grade.toString().trim() !== '';
      console.log('[ChatShell] Student profile check:', { baseComplete, gradeComplete, grade: profile.grade });
      return baseComplete && gradeComplete;
    }
    
    // For parents and teachers, grade is not required
    console.log('[ChatShell] Non-student profile check:', { baseComplete, role: profile.role });
    return baseComplete;
  }, []);

  // Determine when to ask for profile information based on missing fields
  const shouldAskForProfileInfo = useCallback((currentGotItCount, existingProfile) => {
    console.log('[ChatShell] shouldAskForProfileInfo called:', { currentGotItCount, existingProfile });
    
    // Don't ask for account creation if user is already authenticated
    if (isAuthenticated) {
      return {
        ask: false,
        step: null,
        message: null
      };
    }
    
    // Priority order: Check for missing fields in order of importance
    // This ensures that if a user skips a step, we keep asking for it until completed
    
    // 1. Ask for name first (most important)
    if (!existingProfile.firstName || !existingProfile.lastName) {
      return {
        ask: true,
        step: 'name',
        message: "Great! I'd love to know your name so I can personalize our learning experience. What's your first name?"
      };
    }
    
    // 2. Ask for role
    if (!existingProfile.role) {
      return {
        ask: true,
        step: 'role_grade',
        message: "Are you a student, parent, or teacher?"
      };
    }
    
    // 3. Ask for grade (if student)
    if (existingProfile.role === 'student' && !existingProfile.grade) {
      return {
        ask: true,
        step: 'grade',
        message: "What grade are you in? (6-12)"
      };
    }
    
    // 4. Ask for board
    if (!existingProfile.board) {
      return {
        ask: true,
        step: 'board',
        message: "Which board are you studying under? (CBSE, ICSE, State Board, IB, IGCSE, or Other)"
      };
    }
    
    // 5. Ask for subjects
    if (!existingProfile.subjects || existingProfile.subjects.length === 0) {
      return {
        ask: true,
        step: 'subjects',
        message: "Which subjects are you most interested in? You can mention multiple subjects like Math, Science, English, etc."
      };
    }
    
    // 6. Ask for learning style
    if (!existingProfile.learningStyle) {
      return {
        ask: true,
        step: 'learning_style',
        message: "How do you prefer to learn? (Visual - seeing diagrams, Voice - listening, Text - reading, or Hands-on - doing activities)"
      };
    }
    
    // 7. Ask for pace
    if (!existingProfile.pace) {
      return {
        ask: true,
        step: 'pace',
        message: "What's your preferred learning pace? (Fast - quick answers, Normal - balanced, or Detailed - thorough explanations)"
      };
    }
    
    // 8. Ask for location
    if (!existingProfile.state) {
      return {
        ask: true,
        step: 'location',
        message: "Which state are you from? This helps me provide more relevant examples."
      };
    }
    
    // 9. If profile is complete, ask for email
    if (isProfileComplete(existingProfile) && !existingProfile.email) {
      console.log('[ChatShell] Profile complete, asking for email');
      return {
        ask: true,
        step: 'email',
        message: "Great! I see your profile is complete. Let's create your account so you can save your progress and access it from anywhere!"
      };
    }
    
    // 10. If profile is complete and has email but no password, ask for password
    if (isProfileComplete(existingProfile) && existingProfile.email && !existingProfile.password) {
      console.log('[ChatShell] Profile complete with email, asking for password');
      return {
        ask: true,
        step: 'password',
        message: "Perfect! Now let's set up a password for your account."
      };
    }
    
    // 11. If profile is complete and has both email and password, ask for account creation
    if (isProfileComplete(existingProfile) && existingProfile.email && existingProfile.password && !existingProfile.accountCreated) {
      console.log('[ChatShell] Profile complete with email and password, creating account');
      return {
        ask: true,
        step: 'complete',
        message: "Perfect! Your profile is complete and you have both email and password set. Let me create your account now!"
      };
    }
    
    // Don't ask for profile info if everything is complete
    return {
      ask: false,
      step: null,
      message: null
    };
  }, [isProfileComplete, isAuthenticated]);


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

      // Use POST request with body data instead of GET with query params
      console.log('[ChatShell] Sending request with language:', language);
      
      const requestBody = {
        message: userInput,
        sessionId: sessionId,
        messageType: 'text',
        userId: userId,
        language: language
      };

      // Include profile data for guest users (not yet in database)
      if (isGuest && !isAuthenticated) {
        const guestProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
        if (Object.keys(guestProfile).length > 0) {
          requestBody.guestProfile = guestProfile;
        }
      }

      // Only include imageUrl if it exists and is not too large for URL
      if (imageUrl) {
        // Check if imageUrl is a base64 data URL (which can be large)
        if (imageUrl.startsWith('data:')) {
          // For large base64 images, we need to use POST with body
          // But EventSource doesn't support POST, so we'll use fetch with streaming
          console.log('[ChatShell] Large image detected, using fetch instead of EventSource');
          
          const response = await fetch('/api/solve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...requestBody,
              imageUrl: imageUrl
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          // Define cleanup function for fetch-based streaming
          const fetchCleanup = () => {
            setIsStreaming(false);
            console.log('[ChatShell] Fetch cleanup called, setting hideQuickActions to false');
            setHideQuickActions(false);
          };

          // Set timeout to ensure quick actions are shown even if stream doesn't complete
          const streamTimeout = setTimeout(() => {
            console.log('[ChatShell] Stream timeout, showing quick actions');
            fetchCleanup();
          }, 30000); // 30 second timeout

          const processStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  // Stream completed - ensure quick actions are shown
                  console.log('[ChatShell] Stream completed, showing quick actions');
                  clearTimeout(streamTimeout);
                  fetchCleanup();
                  break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const eventData = JSON.parse(line.slice(6));
                      console.log('[ChatShell] Stream event received:', eventData.type, eventData.data);

                      if (eventData.type === 'section' && eventData.data?.section) {
                        const section = eventData.data.section;
                        const sectionContent = `${section.title}\n\n${section.content}`;

                        currentAIMessage = {
                          ...currentAIMessage,
                          content: sectionContent
                        };

                        setMessages(prev => {
                          const newMessages = [...prev];
                          const targetIndex = newMessages.findIndex(m => m.id === currentAIMessage.id);
                          if (targetIndex >= 0 && targetIndex < newMessages.length) {
                            newMessages[targetIndex] = { ...currentAIMessage };
                          }
                          return newMessages;
                        });

                      } else if (eventData.type === 'token' && eventData.data?.token) {
                        const token = eventData.data.token;
                        currentAIMessage = {
                          ...currentAIMessage,
                          content: currentAIMessage.content === "Geni Ma'am is thinking..."
                            ? token
                            : currentAIMessage.content + token
                        };

                        setMessages(prev => {
                          const newMessages = [...prev];
                          const targetIndex = newMessages.findIndex(m => m.id === currentAIMessage.id);
                          if (targetIndex >= 0 && targetIndex < newMessages.length) {
                            newMessages[targetIndex] = { ...currentAIMessage };
                          }
                          return newMessages;
                        });

                      } else if (eventData.type === 'final' || eventData.type === 'done') {
                        clearTimeout(streamTimeout);
                        fetchCleanup();
                        setMessages(prev => {
                          const newMessages = [...prev];
                          const lastIndex = newMessages.length - 1;
                          if (newMessages[lastIndex]?.type === 'ai') {
                            newMessages[lastIndex] = {
                              ...newMessages[lastIndex],
                              content: newMessages[lastIndex].content || "Response completed."
                            };
                          }
                          return newMessages;
                        });
                      } else if (eventData.type === 'error') {
                        clearTimeout(streamTimeout);
                        fetchCleanup();
                        console.error('[ChatShell] Server error:', eventData.data);
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
                      console.warn('Failed to parse stream event:', line, e);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Stream processing error:', error);
              clearTimeout(streamTimeout);
              fetchCleanup();
            }
          };

          processStream();
          return;
        } else {
          // For small image URLs, we can still use EventSource
          requestBody.imageUrl = imageUrl;
        }
      }

      // For text-only messages or small image URLs, use EventSource
      const params = new URLSearchParams();
      Object.entries(requestBody).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });

      const eventSource = new EventSource(`/api/solve?${params.toString()}`);
      currentSSERef.current = eventSource;

      // Add connection state logging
      eventSource.onopen = (event) => {
        console.log('[ChatShell] SSE connection opened:', event);
        clearTimeout(connectionTimeout); // Clear the connection timeout
      };

      // Add a connection timeout to detect if EventSource fails to connect
      const connectionTimeout = setTimeout(() => {
        if (eventSource.readyState === EventSource.CONNECTING) {
          console.error('[ChatShell] EventSource connection timeout - still connecting after 5 seconds');
          eventSource.close();
          cleanup();
          setHideQuickActions(false);
          
          // Show error message
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex]?.type === 'ai') {
              newMessages[lastIndex] = {
                ...newMessages[lastIndex],
                content: "I apologize, but I'm having trouble connecting right now. Please try again."
              };
            }
            return newMessages;
          });
        }
      }, 5000); // 5 second connection timeout

      const cleanup = () => {
        clearTimeout(connectionTimeout); // Clear connection timeout
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        if (currentSSERef.current === eventSource) {
          currentSSERef.current = null;
        }
        setIsStreaming(false);
        // Show quick actions when streaming is done
        console.log('[ChatShell] Cleanup called, setting hideQuickActions to false');
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
        console.error('EventSource readyState:', eventSource.readyState);
        console.error('EventSource url:', eventSource.url);
        console.error('Error event details:', {
          type: error.type,
          target: error.target,
          readyState: error.target?.readyState,
          url: error.target?.url
        });
        
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

    // Track button click event
    gtmEvents.buttonClicked(action, 'quick_reply', currentSessionId);

    // Hide quick actions immediately when any option is clicked
    setHideQuickActions(true);

    // Handle fast track mode toggle
    if (action === 'fast_track_mode') {
      setFastTrackMode(!fastTrackMode);
      const message = fastTrackMode ? 'Switch back to step-by-step mode' : 'Switch to fast-track mode';
      handleSendMessage(message, "text");
      return;
    }

    // Find the message that corresponds to this action using language-specific quick replies
    const quickReplies = getQuickReplies(language);
    const reply = quickReplies.find(r => r.action === action);
    if (!reply) {
      console.warn('Unknown quick reply action:', action);
      return;
    }

    // Send the predefined message
    handleSendMessage(reply.message, "text");

    // Trigger quiz generation for all users on "Got it"
    if (action === 'confirm_understanding' || action === 'got_it') {
      handleGotItClick();
    }
  }, [handleSendMessage, isAuthenticated, fastTrackMode, language]);

  // Handle "Got it" clicks for quiz and progressive profile collection
  const handleGotItClick = useCallback(async () => {
    console.log('[ChatShell] handleGotItClick called:', { 
      gotItCount, 
      isAuthenticated, 
      quizCompletedForCurrentQuestion,
      messagesLength: messages.length 
    });
    const newGotItCount = gotItCount + 1;
    setGotItCount(newGotItCount);

    // Check existing profile data
    const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
    
    // Only show quiz if not already completed for current question
    console.log('[ChatShell] Quiz condition check:', { 
      quizCompletedForCurrentQuestion, 
      willShowQuiz: !quizCompletedForCurrentQuestion 
    });
    
    if (!quizCompletedForCurrentQuestion) {
      // Find the user's original question from recent messages
      const userQuestion = messages.find(msg => msg.type === 'user')?.content;
      
      // Generate contextual quiz question
      console.log('[ChatShell] Calling generateQuizQuestion with:', { subject, userQuestion, messagesCount: messages.length });
      const quiz = await generateQuizQuestion(subject, messages, userQuestion);
      console.log('[ChatShell] Generated quiz:', quiz);
      
      if (quiz && quiz.question) {
        setCurrentQuiz(quiz);
        setQuizStep('question');
        setWaitingForQuizResponse(true);
        console.log('[ChatShell] Quiz state set successfully');
        
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
        console.error('[ChatShell] Quiz generation failed or returned invalid data:', quiz);
        
        // Fallback: show acknowledgment message if quiz generation fails
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
    } else {
      // If quiz already completed, just acknowledge
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
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <img src="/genimam.png" alt="" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Geni Ma’am</h1>
              <p className="text-sm text-white/80">AI Doubt Solver</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Debug button to test quick actions */}
            {/* <button
              onClick={() => {
                console.log('[ChatShell] Debug: Force showing quick actions');
                setHideQuickActions(false);
                setIsStreaming(false);
              }}
              className="px-3 py-1 text-xs bg-white/20 text-white rounded hover:bg-white/30"
            >
              Show Quick Actions
            </button> */}
            
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
          language={language}
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
        key={settingsRefreshKey}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        localProfileData={profileData}
      />

      {/* Vision Input Modal */}
      <VisionInputModal
        isOpen={showVisionInput}
        onClose={() => setShowVisionInput(false)}
        onComplete={handleVisionComplete}
        onError={handleVisionError}
      />

      {/* Profile Collection Modal */}
      <ProfileCollectionWrapper />
      
      {/* Step-wise Profile Collection Modals */}
      <StepWiseProfileWrapper />

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