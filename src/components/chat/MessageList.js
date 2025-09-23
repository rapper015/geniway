'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import MessageBubble from '../MessageBubble';
import QuickRepliesBar from './QuickRepliesBar';
import { getQuickReplies } from './QuickRepliesBar';

const MessageList = forwardRef(({ 
  messages, 
  isStreaming, 
  onRetry, 
  onMCQOptionClick, 
  onQuickReplyClick,
  fastTrackMode = false,
  hideQuickActions = false,
  className = "",
  showOnboarding = false,
  onSubjectSelect,
  onNameCapture,
  onStartChat,
  language = 'english'
}, ref) => {
  const messagesEndRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }));

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showOnboarding) {
    return (
      <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to GeniWay!</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              I'm Geni Ma'am, your AI tutor. I'm here to help you learn and solve your doubts. 
              What would you like to explore today?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> You can ask me questions about any subject, upload images, 
                or use voice input to get help with your studies.
              </p>
            </div>
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message, index) => {
          const isLatestMessage = index === messages.length - 1;
          const isLatestBotMessage = isLatestMessage && message.type === 'ai';
          
          // Check if this AI message is a response to a user question
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const messageIdString = String(message.id || '');
          const messageContent = message.content || '';
          
          // Check if this is a system message that shouldn't show quick actions
          const isSystemMessage = messageIdString.includes('welcome') || 
            messageIdString.includes('profile') || 
            messageIdString.includes('quiz') || 
            messageIdString.includes('ack') || 
            messageIdString.includes('thank') || 
            messageIdString.includes('error') ||
            messageContent.includes('Thank you for providing') ||
            messageContent.includes('Great! Now I\'d love to know') ||
            messageContent.includes('Nice to meet you') ||
            messageContent.includes('What\'s your') ||
            messageContent.includes('are you a student') ||
            messageContent.includes('What grade') ||
            messageContent.includes('🎉 Correct!') ||
            messageContent.includes('❌ Not quite right');
          
          const isResponseToUserQuestion = previousMessage && 
            previousMessage.type === 'user' && 
            message.type === 'ai' &&
            !isSystemMessage; // Not a system message
          
          
          return (
            <div key={message.id} className="space-y-2">
              <MessageBubble 
                message={message}
                onRetry={onRetry}
                onMCQOptionClick={onMCQOptionClick}
              />
              {/* Quick actions only for AI responses to user questions */}
              {isLatestBotMessage && isResponseToUserQuestion && onQuickReplyClick && !hideQuickActions && !isStreaming && (
                <div className="ml-12">
                  <QuickRepliesBar
                    replies={getQuickReplies(language)}
                    onReplySelect={onQuickReplyClick}
                    disabled={isStreaming}
                    fastTrackMode={fastTrackMode}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
