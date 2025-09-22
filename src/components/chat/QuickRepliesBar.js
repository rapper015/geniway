'use client';

import React from 'react';
import { CheckCircle, XCircle, Lightbulb, List, Zap, HelpCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Function to get translated quick replies based on language
export const getQuickReplies = (language = 'english') => {
  const translations = {
    english: {
      confirm_understanding: { label: 'Got it!', message: 'Got it, thanks!' },
      not_clear: { label: 'Not Clear', message: 'Can you explain this differently?' },
      show_hint: { label: 'Hint', message: 'Can you give me a hint?' },
      show_steps: { label: 'Steps', message: 'Please show detailed steps' },
      fast_track_mode: { label: 'Fast Track', message: 'Switch to fast-track mode' }
    },
    hindi: {
      confirm_understanding: { label: 'समझ गया!', message: 'समझ गया, धन्यवाद!' },
      not_clear: { label: 'स्पष्ट नहीं', message: 'क्या आप इसे अलग तरीके से समझा सकते हैं?' },
      show_hint: { label: 'संकेत', message: 'क्या आप मुझे एक संकेत दे सकते हैं?' },
      show_steps: { label: 'चरण', message: 'कृपया विस्तृत चरण दिखाएं' },
      fast_track_mode: { label: 'तेज़ ट्रैक', message: 'तेज़ ट्रैक मोड पर स्विच करें' }
    },
    hinglish: {
      confirm_understanding: { label: 'Got it!', message: 'Got it, thanks!' },
      not_clear: { label: 'Clear नहीं', message: 'क्या आप इसे differently explain कर सकते हैं?' },
      show_hint: { label: 'Hint', message: 'क्या आप मुझे एक hint दे सकते हैं?' },
      show_steps: { label: 'Steps', message: 'कृपया detailed steps दिखाएं' },
      fast_track_mode: { label: 'Fast Track', message: 'Fast track mode पर switch करें' }
    }
  };

  const lang = language === 'हिंदी' ? 'hindi' : language === 'हिंग्लिश' ? 'hinglish' : 'english';
  const t = translations[lang] || translations.english;

  return [
    {
      id: 'confirm_understanding',
      label: t.confirm_understanding.label,
      icon: CheckCircle,
      color: 'bg-green-500 hover:bg-green-600 text-white',
      action: 'confirm_understanding',
      message: t.confirm_understanding.message
    },
    {
      id: 'not_clear',
      label: t.not_clear.label,
      icon: XCircle,
      color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
      action: 'not_clear',
      message: t.not_clear.message
    },
    {
      id: 'show_hint',
      label: t.show_hint.label,
      icon: Lightbulb,
      color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
      action: 'show_hint',
      message: t.show_hint.message
    },
    {
      id: 'show_steps',
      label: t.show_steps.label,
      icon: List,
      color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
      action: 'show_steps',
      message: t.show_steps.message
    },
    {
      id: 'fast_track_mode',
      label: t.fast_track_mode.label,
      icon: Zap,
      color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
      action: 'fast_track_mode',
      message: t.fast_track_mode.message
    }
  ];
};

// Keep the old constant for backward compatibility
export const DEFAULT_QUICK_REPLIES = getQuickReplies('english');

export function useQuickReplies({ 
  messageType, 
  isLatestMessage, 
  hasError, 
  isStreaming,
  fastTrackEnabled,
  contentMode,
  isAIMessage = false,
  language = 'english'
}) {
  // Only show quick replies for AI messages that are the latest and not streaming
  if (!isAIMessage || !isLatestMessage || isStreaming || hasError) {
    return [];
  }

  // Show quick replies for all AI responses with language-specific translations
  return getQuickReplies(language);
}

export default function QuickRepliesBar({ 
  replies, 
  onReplySelect, 
  disabled = false,
  fastTrackMode = false
}) {
  if (!replies || replies.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap gap-2 justify-start">
        {replies.map((reply) => {
          const Icon = reply.icon;
          const label = reply.id === 'fast_track_mode' 
            ? (fastTrackMode ? 'Step-by-Step' : 'Fast Track')
            : reply.label;
          return (
            <button
              key={reply.id}
              onClick={() => onReplySelect(reply.action)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : reply.color + ' hover:shadow-md active:scale-95'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
