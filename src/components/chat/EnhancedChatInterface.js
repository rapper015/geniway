'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Image, Mic, Loader2, Bot, User, BookOpen, MessageSquare, Mic as MicIcon, Image as ImageIcon, Settings } from 'lucide-react';
import MessageBubble from '../MessageBubble';
import SettingsModal from './SettingsModal';
import QuickActions from './QuickActions';

export default function EnhancedChatInterface({ subject, onBack }) {
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentSection, setCurrentSection] = useState(null);
  const [showMCQ, setShowMCQ] = useState(false);
  const [mcqOptions, setMcqOptions] = useState([]);
  const [showHints, setShowHints] = useState(false);
  const [availableHints, setAvailableHints] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [lastMessage, setLastMessage] = useState(null);
  
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const eventSourceRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const initializeSession = async () => {
    try {
      const userId = isAuthenticated ? user.id : (isGuest ? guestUser.id : 'anonymous');
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          subject: subject || 'general',
          isGuest: isGuest 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
        
        // Add welcome message
        const welcomeMessage = {
          id: 'welcome',
          type: 'ai',
          content: `Hello! I'm Geni Ma'am, your AI tutor. I'm here to help you learn ${subject || 'various subjects'}. What would you like to explore today?`,
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages([welcomeMessage]);
        setLastMessage(welcomeMessage);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (content, type = 'text', imageUrl = null) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      messageType: type,
      imageUrl
    };

    // Add user message immediately to UI for instant feedback
    setMessages(prev => [...prev, userMessage]);
    setLastMessage(userMessage);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    // Handle session creation in background - don't block UI
    const handleSessionAndStreaming = async () => {
      try {
        // Get or create session
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const userId = isAuthenticated ? user.id : (isGuest ? guestUser.id : 'anonymous');
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              userId, 
              subject: subject || 'general',
              isGuest: isGuest 
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            currentSessionId = data.sessionId;
            setSessionId(currentSessionId);
          } else {
            throw new Error('Failed to create session');
          }
        }

        // Use SSE streaming for real-time responses
        const params = new URLSearchParams({
          sessionId: currentSessionId || 'new',
          message: content,
          type,
          ...(imageUrl && { imageUrl })
        });

        const eventSource = new EventSource(`/api/solve?${params}`);
        eventSourceRef.current = eventSource;

      let currentSectionData = null;
      let currentStepData = null;
      let tokenBuffer = '';

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connection':
              console.log('Connected to streaming:', data.data);
              break;
              
            case 'section':
              currentSectionData = data.data.section;
              setCurrentSection(currentSectionData);
              
              // Add section header message
              const sectionMessage = {
                id: `section-${currentSectionData.id}`,
                type: 'ai',
                content: `## ${currentSectionData.title}\n\n${currentSectionData.content}`,
                timestamp: new Date(),
                messageType: 'text',
                sectionId: currentSectionData.id
              };
              setMessages(prev => [...prev, sectionMessage]);
              break;
              
            case 'step':
              currentStepData = data.data.step;
              // Steps are already included in section content
              break;
              
            case 'token':
              tokenBuffer += data.data.token;
              setStreamingContent(tokenBuffer);
              break;
              
            case 'final':
              // Finalize the streaming content
              if (tokenBuffer) {
                const finalMessage = {
                  id: `ai-${Date.now()}`,
                  type: 'ai',
                  content: tokenBuffer,
                  timestamp: new Date(),
                  messageType: 'text',
                  sectionId: currentSectionData?.id
                };
                setMessages(prev => [...prev, finalMessage]);
                setStreamingContent('');
                tokenBuffer = '';
              }
              
              // Handle MCQ if present
              if (currentSectionData?.mcqOptions) {
                setShowMCQ(true);
                setMcqOptions(currentSectionData.mcqOptions);
              }
              
              // Handle hints if present
              if (currentSectionData?.hints) {
                setShowHints(true);
                setAvailableHints(currentSectionData.hints);
              }
              break;
              
            case 'error':
              console.error('Streaming error:', data.data);
              const errorMessage = {
                id: `error-${Date.now()}`,
                type: 'ai',
                content: `I'm sorry, I encountered an error: ${data.data.error}. Please try again.`,
                timestamp: new Date(),
                messageType: 'text'
              };
              setMessages(prev => [...prev, errorMessage]);
              break;
              
            case 'complete':
              console.log('Streaming completed');
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        setIsLoading(false);
        setIsStreaming(false);
      };

      } catch (error) {
        console.error('Error in session creation or streaming:', error);
        const errorMessage = {
          id: `error-${Date.now()}`,
          type: 'ai',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
        setIsStreaming(false);
      }
    };

    // Start session creation and streaming in background
    handleSessionAndStreaming();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        sendMessage('I uploaded an image. Can you help me understand what\'s in it?', 'image', imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            sendMessage(data.transcript, 'voice');
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMCQAnswer = async (optionId) => {
    if (!currentSection) return;
    
    try {
      const response = await fetch('/api/mcq/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentSection.id,
          selectedAnswer: optionId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const feedbackMessage = {
          id: `feedback-${Date.now()}`,
          type: 'ai',
          content: data.explanation,
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages(prev => [...prev, feedbackMessage]);
        setShowMCQ(false);
      }
    } catch (error) {
      console.error('Error validating MCQ answer:', error);
    }
  };

  const handleGetHint = async (hintLevel) => {
    if (!currentSection) return;
    
    try {
      const response = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sectionId: currentSection.id,
          hintLevel
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const hintMessage = {
          id: `hint-${Date.now()}`,
          type: 'ai',
          content: `Hint ${hintLevel}: ${data.hint}`,
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages(prev => [...prev, hintMessage]);
        setLastMessage(hintMessage);
      }
    } catch (error) {
      console.error('Error getting hint:', error);
    }
  };

  const handleQuickAction = (action, data) => {
    if (data.response) {
      sendMessage(data.response, 'text');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <span className="text-lg sm:text-xl">←</span>
            </button>
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {subject ? `${subject} Chat` : 'AI Tutor Chat'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {isAuthenticated ? user.name : (isGuest ? guestUser.name : 'Guest')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                showQuickActions 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Quick Actions</span>
              <span className="sm:hidden">QA</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
          
          {isStreaming && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Geni Ma'am is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {/* Streaming content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-2xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-gradient-to-br from-blue-500 to-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-md p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                  <span className="font-semibold text-sm text-gray-800">Geni Ma'am</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <MessageSquare className="w-3 h-3" /> Text
                  </span>
                </div>
                <div className="prose prose-blue max-w-none text-sm leading-relaxed">
                  {streamingContent}
                  <span className="animate-pulse">|</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* MCQ Options */}
        {showMCQ && mcqOptions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Choose the correct answer:</h3>
            <div className="grid grid-cols-1 gap-2">
              {mcqOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleMCQAnswer(option.id)}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <span className="font-medium text-blue-900">{option.id.toUpperCase()})</span> {option.text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Hints */}
        {showHints && availableHints.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-3">Need help? Try these hints:</h3>
            <div className="space-y-2">
              {availableHints.map((hint) => (
                <button
                  key={hint.id}
                  onClick={() => handleGetHint(hint.level)}
                  disabled={hint.isRevealed}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    hint.isRevealed 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-white border border-yellow-200 hover:bg-yellow-50'
                  }`}
                >
                  <span className="font-medium text-yellow-900">Hint {hint.level}:</span>
                  {hint.isRevealed ? ' Already revealed' : ' Click to reveal'}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && (
        <QuickActions
          onAction={handleQuickAction}
          isVisible={showQuickActions}
          currentMessage={lastMessage}
          sessionId={sessionId}
        />
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question or message..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleImageUpload}
              className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              disabled={isLoading}
            >
              <MicIcon className="w-5 h-5" />
            </button>
            
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
