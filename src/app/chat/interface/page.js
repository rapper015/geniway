'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Mic, Camera, BookOpen, User, Image as ImageIcon, MicOff, Square, BarChart3 } from 'lucide-react';
import { chatStorage } from '../../../lib/chatStorage';
import { guestUserManager } from '../../../lib/guestUser';
import { useAuth } from '../../../contexts/AuthContext';
import MessageBubble from '../../../components/MessageBubble';

export default function ChatInterface() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, guestUser, isAuthenticated, isGuest, migrationStatus } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    console.log('ChatInterface: Auth state changed', { isAuthenticated, user, isGuest, guestUser });
    
    // Check if user is authenticated or guest
    if (isAuthenticated && user) {
      // Authenticated user
      console.log('ChatInterface: Setting up authenticated user:', user.name);
      setUserName(user.name);
      setSelectedSubject(user.preferences?.selectedSubject || 'general');
      setIsGuestMode(false);
      
      // Load user's chat sessions from database (implement later)
      // For now, show welcome message
      const welcomeMessage = {
        id: 1,
        type: 'ai',
        content: `Welcome back, ${user.name}! 👋 I'm Geni Ma'am, your AI learning assistant. I'm here to help you with ${getSubjectName(user.preferences?.selectedSubject || 'general')}. What would you like to learn today?`,
        timestamp: new Date(),
        messageType: 'text'
      };
      setMessages([welcomeMessage]);
      
    } else if (isGuest && guestUser) {
      // Guest user
      const storedName = localStorage.getItem('userName');
      const storedSubject = localStorage.getItem('selectedSubject');
      
      if (!storedName || !storedSubject) {
        router.push('/chat');
        return;
      }

      setUserName(storedName);
      setSelectedSubject(storedSubject);
      setIsGuestMode(true);

      // Create or get current guest session
      let session = guestUserManager.getCurrentGuestSession();
      if (!session) {
        session = guestUserManager.saveGuestChatSession({
          subject: storedSubject,
          userName: storedName,
          messages: [],
          messageCounts: { text: 0, voice: 0, image: 0 }
        });
      }
      setCurrentSession(session);

      // Load existing messages or add welcome message
      if (session.messages && session.messages.length > 0) {
        setMessages(session.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        const welcomeMessage = {
          id: 1,
          type: 'ai',
          content: `Hello ${storedName}! 👋 I'm Geni Ma'am, your AI learning assistant. I'm here to help you with ${getSubjectName(storedSubject)}. What would you like to learn today?`,
          timestamp: new Date(),
          messageType: 'text'
        };
        setMessages([welcomeMessage]);
        guestUserManager.addMessageToGuestSession(welcomeMessage);
      }
    } else {
      // No user data, redirect to subject selection
      router.push('/chat');
    }
  }, [router, isAuthenticated, isGuest, user, guestUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getSubjectName = (subjectId) => {
    const subjectNames = {
      'mathematics': 'Mathematics',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
      'english': 'English',
      'social-science': 'Social Science',
      'computer-science': 'Computer Science',
      'general': 'General'
    };
    return subjectNames[subjectId] || 'General';
  };

  const handleSendMessage = async (messageType = 'text', content = null, imageUrl = null) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      messageType: messageType,
      imageUrl: imageUrl
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save message based on user type
    if (isGuestMode) {
      guestUserManager.addMessageToGuestSession(userMessage);
    } else {
      chatStorage.addMessage(userMessage);
    }
    
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call OpenAI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          messageType: messageType,
          imageUrl: imageUrl,
          sessionId: currentSession?.id,
          userId: user?.id,
          subject: selectedSubject,
          userName: userName
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.content,
          timestamp: new Date(),
          messageType: 'text',
          usage: data.usage,
          model: data.model
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Save AI message based on user type
        if (isGuestMode) {
          guestUserManager.addMessageToGuestSession(aiMessage);
        } else {
          chatStorage.addMessage(aiMessage);
        }
      } else {
        // Handle API error
        const errorMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.error || "I apologize, but I'm having trouble processing your request right now. Please try again.",
          timestamp: new Date(),
          messageType: 'text'
        };

        setMessages(prev => [...prev, errorMessage]);
        
        if (isGuestMode) {
          guestUserManager.addMessageToGuestSession(errorMessage);
        } else {
          chatStorage.addMessage(errorMessage);
        }
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
        messageType: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
      
      if (isGuestMode) {
        guestUserManager.addMessageToGuestSession(errorMessage);
      } else {
        chatStorage.addMessage(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        handleSendMessage('image', `Image uploaded: ${file.name}`, imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        // Simulate voice-to-text conversion
        const simulatedTranscript = "This is a simulated voice-to-text transcript. In real implementation, this would use speech recognition API.";
        setTranscript(simulatedTranscript);
        setShowTranscript(true);
        setAudioChunks([]);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleVoiceSend = () => {
    if (transcript.trim()) {
      handleSendMessage('voice', transcript);
      setTranscript('');
      setShowTranscript(false);
    }
  };

  const handleBackClick = () => {
    router.push('/chat');
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Geni Ma'am</h1>
              <p className="text-sm text-white/80">{getSubjectName(selectedSubject)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStats(true)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="View Chat Statistics"
            >
              <BarChart3 className="w-4 h-4 text-white" />
            </button>
          <div className="flex items-center gap-2 text-white/80">
            <User className="w-4 h-4" />
            <span className="text-sm">{userName}</span>
            {isGuestMode && (
              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                Guest
              </span>
            )}
          </div>
          </div>
        </div>
      </header>

      {/* Migration Status Banner */}
      {migrationStatus === 'migrating' && (
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-blue-700 text-sm">
              Migrating your guest data to your account...
            </p>
          </div>
        </div>
      )}
      
      {migrationStatus === 'completed' && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4">
          <p className="text-green-700 text-sm">
            ✅ Your guest data has been successfully migrated to your account!
          </p>
        </div>
      )}
      
      {migrationStatus === 'failed' && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4">
          <p className="text-red-700 text-sm">
            ⚠️ Failed to migrate guest data. Your data is still saved locally.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 shadow-sm border border-gray-200 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-gray-600 ml-2">
                  {messages[messages.length - 1]?.messageType === 'image' 
                    ? 'Geni Ma\'am is analyzing your image...' 
                    : 'Geni Ma\'am is thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Statistics Modal */}
      {showStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Chat Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium">Text Messages</span>
                <span className="text-lg font-bold text-blue-600">
                  {currentSession?.messageCounts?.text || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium">Voice Messages</span>
                <span className="text-lg font-bold text-green-600">
                  {currentSession?.messageCounts?.voice || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium">Image Messages</span>
                <span className="text-lg font-bold text-purple-600">
                  {currentSession?.messageCounts?.image || 0}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Total Messages</span>
                <span className="text-lg font-bold text-gray-600">
                  {messages.length}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Voice Transcript Modal */}
      {showTranscript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Voice Transcript</h3>
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTranscript(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVoiceSend}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end gap-3">
          {/* Image Upload Button */}
          <button 
            onClick={handleImageUpload}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
            title="Upload Image"
          >
            <Camera className="w-5 h-5" />
          </button>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your question here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {/* Voice Recording Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isRecording ? "Stop Recording" : "Start Voice Recording"}
          >
            {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center gap-2 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording... Click the square button to stop
          </div>
        )}
        
        {/* Button Labels */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>📷 Upload Image</span>
          <span>🎤 Voice</span>
          <span>💬 Send</span>
        </div>
      </div>
    </div>
  );
}
