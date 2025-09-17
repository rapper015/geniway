'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MessageBubble({ message }) {
  const formatContent = (content) => {
    if (!content) return '';
    
    // Handle LaTeX math expressions
    let formattedContent = content
      // Convert \( \) to $ $ for inline math
      .replace(/\\\(([^)]+)\\\)/g, '$$$1$$')
      // Convert \[ \] to $$ $$ for block math
      .replace(/\\\[([^\]]+)\\\]/g, '$$$$$1$$$$')
      // Convert single $ to $$ for better rendering
      .replace(/(?<!\$)\$(?!\$)([^$]+)\$(?!\$)/g, '$$$1$$');
    
    return formattedContent;
  };

  const renderMessageContent = () => {
    if (message.type === 'user') {
      return (
        <div className="text-sm leading-relaxed">
          {message.content}
        </div>
      );
    }

    // For AI messages, use markdown rendering
    return (
      <div className="text-sm leading-relaxed prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Custom styling for different elements
            p: ({ children }) => (
              <p className="mb-3 last:mb-0 text-gray-800 leading-relaxed">
                {children}
              </p>
            ),
            h1: ({ children }) => (
              <h1 className="text-lg font-bold text-gray-900 mb-3 mt-4 first:mt-0">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-gray-900 mb-2 mt-3 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-gray-900 mb-2 mt-2 first:mt-0">
                {children}
              </h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-3 space-y-1 text-gray-800">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-800">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-800">
                {children}
              </li>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className="block bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 rounded-r-lg mb-3 italic text-gray-700">
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-900">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">
                {children}
              </em>
            ),
            // Math rendering
            div: ({ children, className }) => {
              if (className?.includes('katex')) {
                return (
                  <div className="my-3 overflow-x-auto">
                    {children}
                  </div>
                );
              }
              return <div className={className}>{children}</div>;
            }
          }}
        >
          {formatContent(message.content)}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`max-w-xs lg:max-w-2xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
        {/* Message Type Indicator */}
        <div className={`text-xs mb-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            message.type === 'user' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {message.messageType === 'text' && '💬 Text'}
            {message.messageType === 'voice' && '🎤 Voice'}
            {message.messageType === 'image' && '📷 Image'}
            {message.type === 'ai' && '🤖 AI'}
          </span>
        </div>
        
        {/* Message Content */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            message.type === 'user'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-900 shadow-sm border border-gray-200'
          }`}
        >
          {/* Image Display */}
          {message.imageUrl && (
            <div className="mb-3">
              <img
                src={message.imageUrl}
                alt="Uploaded"
                className="max-w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          )}
          
          {/* Message Content */}
          {renderMessageContent()}
          
          {/* Timestamp */}
          <div className={`text-xs mt-3 pt-2 border-t ${
            message.type === 'user' 
              ? 'border-blue-400 text-blue-100' 
              : 'border-gray-200 text-gray-500'
          }`}>
            <div className="flex items-center justify-between">
              <span>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
