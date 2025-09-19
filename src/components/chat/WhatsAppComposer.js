'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Image, Mic, Square } from 'lucide-react';

export default function WhatsAppComposer({
  onSendMessage,
  onImageUpload,
  onVoiceTranscript,
  disabled,
  isOnline
}) {
  const [textContent, setTextContent] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setTextContent(value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 120);
    setInputHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSend = () => {
    console.log('[WhatsAppComposer] handleSend called:', { textContent: textContent.trim(), disabled });
    if (textContent.trim() && !disabled) {
      const messageText = textContent.trim();
      console.log('[WhatsAppComposer] Sending message:', messageText);
      // Clear input immediately to prevent double sends
      setTextContent("");
      setInputHeight(40);
      // Send message immediately without setTimeout
      onSendMessage(messageText, "text");
    } else {
      console.log('[WhatsAppComposer] Cannot send message:', { hasText: !!textContent.trim(), disabled });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = textContent.trim().length > 0 && !disabled;

  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        setIsTranscribing(true);
        
        try {
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.transcript && data.transcript.trim()) {
              onVoiceTranscript(data.transcript);
            }
          } else {
            console.error('Transcription failed');
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
        } finally {
          setIsTranscribing(false);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [onVoiceTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const handleVoiceButtonClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <div className="border-t border-gray-200 bg-white fixed bottom-0 w-full z-20">
      {/* Recording indicator */}
      {isRecording && (
        <div className="px-3 py-1 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span>Recording... Click the square to stop</span>
          </div>
        </div>
      )}
      
      {/* Transcribing indicator */}
      {isTranscribing && (
        <div className="px-3 py-1 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Transcribing your voice...</span>
          </div>
        </div>
      )}
      
      <div className="px-3 py-2">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            onClick={onImageUpload}
            disabled={disabled}
            className="flex-shrink-0 w-9 h-9 rounded-full text-blue-600 hover:bg-blue-50 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 ease-in-out p-1.5 shadow-sm border border-blue-200 hover:border-blue-300"
            title="Upload image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Text input container */}
          <div className="flex-1 bg-gray-100 rounded-2xl flex items-end overflow-hidden">
            <textarea
              value={textContent}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={isOnline ? "Type a message..." : "You're offline. Messages will be sent when online."}
              disabled={disabled}
              className="flex-1 bg-transparent border-0 outline-0 resize-none py-2 pl-4 pr-2 text-sm placeholder-gray-500 leading-5"
              style={{ height: `${inputHeight}px` }}
              rows={1}
            />

            {/* Voice button inside input */}
            <div className="p-1 pr-2 flex items-end">
              <button
                onClick={handleVoiceButtonClick}
                disabled={disabled || isTranscribing}
                className={`w-7 h-7 rounded-full transition-colors ${
                  isRecording 
                    ? 'text-red-600 bg-red-100 hover:bg-red-200' 
                    : isTranscribing
                    ? 'text-blue-600 bg-blue-100'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
                title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Start voice recording'}
              >
                {isRecording ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`flex-shrink-0 w-9 h-9 rounded-full p-1.5 transition-all duration-200 ease-in-out shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              canSend
                ? "bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.99] text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed disabled:opacity-50"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
