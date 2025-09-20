'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('english');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('geniway_language');
    if (savedLanguage && ['english', 'hindi', 'hinglish'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const changeLanguage = (newLanguage) => {
    if (['english', 'hindi', 'hinglish'].includes(newLanguage)) {
      setLanguage(newLanguage);
      localStorage.setItem('geniway_language', newLanguage);
      console.log('[LanguageContext] Language changed to:', newLanguage);
    }
  };

  // Get language instructions for AI
  const getLanguageInstructions = () => {
    switch (language) {
      case 'hindi':
        return 'Please respond in Hindi (हिंदी). Use Devanagari script.';
      case 'hinglish':
        return 'Please respond in Hinglish (mix of Hindi and English). Use both Devanagari script and English as appropriate.';
      case 'english':
      default:
        return 'Please respond in English.';
    }
  };

  // Get language display name
  const getLanguageDisplayName = (lang) => {
    switch (lang) {
      case 'hindi':
        return 'हिंदी';
      case 'hinglish':
        return 'Hinglish';
      case 'english':
      default:
        return 'English';
    }
  };

  const value = {
    language,
    changeLanguage,
    getLanguageInstructions,
    getLanguageDisplayName,
    isHindi: language === 'hindi',
    isHinglish: language === 'hinglish',
    isEnglish: language === 'english'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
