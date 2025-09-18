'use client';

import React from 'react';
import { CheckCircle, XCircle, Lightbulb, List, Zap, HelpCircle, RotateCcw } from 'lucide-react';

export const DEFAULT_QUICK_REPLIES = [
  {
    id: 'confirm_understanding',
    label: 'Got it!',
    icon: CheckCircle,
    color: 'bg-green-500 hover:bg-green-600 text-white',
    action: 'confirm_understanding',
    message: 'Got it, thanks!'
  },
  {
    id: 'not_clear',
    label: 'Not Clear',
    icon: XCircle,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    action: 'not_clear',
    message: 'Can you explain this differently?'
  },
  {
    id: 'show_hint',
    label: 'Hint',
    icon: Lightbulb,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    action: 'show_hint',
    message: 'Can you give me a hint?'
  },
  {
    id: 'show_steps',
    label: 'Steps',
    icon: List,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    action: 'show_steps',
    message: 'Please show detailed steps'
  },
  {
    id: 'fast_track_mode',
    label: 'Fast Track',
    icon: Zap,
    color: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    action: 'fast_track_mode',
    message: 'Switch to fast-track mode'
  }
];

export function useQuickReplies({ 
  messageType, 
  isLatestMessage, 
  hasError, 
  isStreaming,
  fastTrackEnabled,
  contentMode,
  isAIMessage = false
}) {
  // Only show quick replies for AI messages that are the latest and not streaming
  if (!isAIMessage || !isLatestMessage || isStreaming || hasError) {
    return [];
  }

  // Show quick replies for all AI responses
  return DEFAULT_QUICK_REPLIES;
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
