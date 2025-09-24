'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { gtmEvents } from '../lib/gtm';

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
    const validLanguages = ['english', 'hindi', 'hinglish', 'हिंदी', 'हिंग्लिश', 'अंग्रेजी'];
    if (savedLanguage && validLanguages.includes(savedLanguage)) {
      // Normalize to English script for internal use
      let normalizedLanguage = savedLanguage;
      if (savedLanguage === 'हिंदी') normalizedLanguage = 'hindi';
      if (savedLanguage === 'हिंग्लिश') normalizedLanguage = 'hinglish';
      if (savedLanguage === 'अंग्रेजी') normalizedLanguage = 'english';
      
      setLanguage(normalizedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const changeLanguage = (newLanguage) => {
    // Support both English and Hindi script language names
    const validLanguages = ['english', 'hindi', 'hinglish', 'हिंदी', 'हिंग्लिश', 'अंग्रेजी'];
    if (validLanguages.includes(newLanguage)) {
      // Normalize to English script for internal use
      let normalizedLanguage = newLanguage;
      if (newLanguage === 'हिंदी') normalizedLanguage = 'hindi';
      if (newLanguage === 'हिंग्लिश') normalizedLanguage = 'hinglish';
      if (newLanguage === 'अंग्रेजी') normalizedLanguage = 'english';
      
      setLanguage(normalizedLanguage);
      localStorage.setItem('geniway_language', normalizedLanguage);
      
      // Track language switch event
      gtmEvents.languageSwitched(normalizedLanguage);
    } else {
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
