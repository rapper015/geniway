'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  List, 
  Zap, 
  HelpCircle,
  MessageSquare,
  BookOpen,
  Target,
  Clock
} from 'lucide-react';

export default function QuickActions({ 
  onAction, 
  isVisible = true, 
  currentMessage = null,
  sessionId = null 
}) {
  const [selectedAction, setSelectedAction] = useState(null);

  const handleAction = (action, data = {}) => {
    setSelectedAction(action);
    onAction(action, { ...data, sessionId });
    
    // Reset selection after a delay
    setTimeout(() => setSelectedAction(null), 2000);
  };

  if (!isVisible) return null;

  const actions = [
    {
      id: 'got_it',
      label: 'Got it!',
      icon: CheckCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'I understand this concept',
      action: () => handleAction('got_it', { response: 'I understand this concept well.' })
    },
    {
      id: 'not_clear',
      label: 'Not Clear',
      icon: XCircle,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'I need more explanation',
      action: () => handleAction('not_clear', { response: 'I need more explanation on this topic.' })
    },
    {
      id: 'hint',
      label: 'Hint',
      icon: Lightbulb,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Give me a hint',
      action: () => handleAction('hint', { response: 'Can you give me a hint to solve this?' })
    },
    {
      id: 'steps',
      label: 'Steps',
      icon: List,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Show me the steps',
      action: () => handleAction('steps', { response: 'Can you break this down into steps?' })
    },
    {
      id: 'fast_track',
      label: 'Fast Track',
      icon: Zap,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Skip to the answer',
      action: () => handleAction('fast_track', { response: 'Can you give me the direct answer?' })
    },
    {
      id: 'why',
      label: 'Why?',
      icon: HelpCircle,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      description: 'Explain the reasoning',
      action: () => handleAction('why', { response: 'Why is this the correct approach?' })
    }
  ];

  const learningActions = [
    {
      id: 'example',
      label: 'Example',
      icon: BookOpen,
      color: 'bg-cyan-500 hover:bg-cyan-600',
      description: 'Show me an example',
      action: () => handleAction('example', { response: 'Can you give me an example of this concept?' })
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: Target,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Give me practice problems',
      action: () => handleAction('practice', { response: 'Can you give me some practice problems?' })
    },
    {
      id: 'summary',
      label: 'Summary',
      icon: MessageSquare,
      color: 'bg-teal-500 hover:bg-teal-600',
      description: 'Summarize what we learned',
      action: () => handleAction('summary', { response: 'Can you summarize what we learned today?' })
    },
    {
      id: 'time_check',
      label: 'Time Check',
      icon: Clock,
      color: 'bg-gray-500 hover:bg-gray-600',
      description: 'How long will this take?',
      action: () => handleAction('time_check', { response: 'How long will it take to learn this topic?' })
    }
  ];

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Main Quick Actions */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={isSelected}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg text-white transition-all duration-200 ${
                    isSelected 
                      ? 'scale-95 opacity-75' 
                      : action.color
                  } ${isSelected ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  title={action.description}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Learning Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Learning Tools</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {learningActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={isSelected}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg text-white transition-all duration-200 ${
                    isSelected 
                      ? 'scale-95 opacity-75' 
                      : action.color
                  } ${isSelected ? 'cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  title={action.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium text-center leading-tight">
                    {action.label}
                  </span>
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Context-aware suggestions */}
        {currentMessage && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Use these quick actions to interact with Geni Ma'am more effectively. 
              Each action sends a specific request to get the help you need.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
