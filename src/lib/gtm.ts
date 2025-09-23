// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// GTM Event tracking functions
export const gtmEvents = {
  // Event: user_onboarding_start - When user begins onboarding form
  userOnboardingStart: (sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'user_onboarding_start',
        event_category: 'onboarding',
        event_label: 'Onboarding Started',
        event_action: 'start_student_onboarding',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: user_onboarding_start', { sessionId });
    }
  },

  // Event: user_onboarding_complete - When profile is created in database
  userOnboardingComplete: (profileId?: string, email?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'user_onboarding_complete',
        event_category: 'conversion',
        event_label: 'Onboarding Completed',
        event_action: 'complete_student_onboarding',
        profile_id: profileId || 'unknown',
        email: email || 'anonymous',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: user_onboarding_complete', { profileId, email, sessionId });
    }
  },

  // Event: form_submission - When any form is submitted successfully
  formSubmission: (formType?: string, sessionId?: string, email?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'form_submission',
        event_category: 'form',
        event_label: 'Form Submitted',
        event_action: 'submit_form',
        form_type: formType || 'unknown',
        session_id: sessionId || 'unknown',
        email: email || 'anonymous'
      });
      console.log('GTM Event: form_submission', { formType, sessionId, email });
    }
  },

  // Event: chat_session_start - When user starts their first chat
  chatSessionStart: (profileId?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'chat_session_start',
        event_category: 'engagement',
        event_label: 'Chat Session Started',
        event_action: 'start_chat_session',
        profile_id: profileId || 'unknown',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: chat_session_start', { profileId, sessionId });
    }
  },

  // Event: profile_created - When database record is created
  profileCreated: (profileId?: string, email?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'profile_created',
        event_category: 'conversion',
        event_label: 'Profile Created',
        event_action: 'create_student_profile',
        profile_id: profileId || 'unknown',
        email: email || 'anonymous',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: profile_created', { profileId, email, sessionId });
    }
  },

  // Event: conversion_milestone - Key funnel progression points
  conversionMilestone: (milestone?: string, sessionId?: string, additionalData?: any) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'conversion_milestone',
        event_category: 'conversion',
        event_label: 'Milestone Reached',
        event_action: 'reach_conversion_milestone',
        milestone: milestone || 'unknown',
        session_id: sessionId || 'unknown',
        ...additionalData
      });
      console.log('GTM Event: conversion_milestone', { milestone, sessionId, additionalData });
    }
  },

  // Event: chat_message_sent - When user sends a message
  chatMessageSent: (messageType?: string, sessionId?: string, userId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'chat_message_sent',
        event_category: 'engagement',
        event_label: 'Message Sent',
        event_action: 'send_chat_message',
        message_type: messageType || 'text',
        session_id: sessionId || 'unknown',
        user_id: userId || 'unknown'
      });
      console.log('GTM Event: chat_message_sent', { messageType, sessionId, userId });
    }
  },

  // Event: quiz_completed - When user completes a quiz
  quizCompleted: (quizId?: string, score?: number, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'quiz_completed',
        event_category: 'engagement',
        event_label: 'Quiz Completed',
        event_action: 'complete_quiz',
        quiz_id: quizId || 'unknown',
        score: score || 0,
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: quiz_completed', { quizId, score, sessionId });
    }
  },

  // Event: language_switched - When user changes language
  languageSwitched: (language?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'language_switched',
        event_category: 'engagement',
        event_label: 'Language Changed',
        event_action: 'switch_language',
        language: language || 'unknown',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: language_switched', { language, sessionId });
    }
  },

  // Event: button_clicked - Generic button click tracking
  buttonClicked: (buttonName?: string, location?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'button_clicked',
        event_category: 'engagement',
        event_label: 'Button Clicked',
        event_action: 'click_button',
        button_name: buttonName || 'unknown',
        location: location || 'unknown',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: button_clicked', { buttonName, location, sessionId });
    }
  },

  // Event: solve_doubt_cta_click - When user clicks CTA buttons to solve doubts
  solveDoubtCtaClick: (buttonName?: string, location?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'solve_doubt_cta_click',
        event_category: 'conversion',
        event_label: 'Solve Doubt CTA Clicked',
        event_action: 'click_solve_doubt_cta',
        button_name: buttonName || 'unknown',
        location: location || 'unknown',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: solve_doubt_cta_click', { buttonName, location, sessionId });
    }
  },

  // Event: link_shared - When link is shared via WhatsApp
  linkShared: (shareMethod?: string, location?: string, sessionId?: string) => {
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'link_shared',
        event_category: 'engagement',
        event_label: 'Link Shared',
        event_action: 'share_link',
        share_method: shareMethod || 'unknown',
        location: location || 'unknown',
        session_id: sessionId || 'unknown'
      });
      console.log('GTM Event: link_shared', { shareMethod, location, sessionId });
    }
  }
};

export const initializeGTM = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];

    // Track page view
    window.dataLayer.push({
      event: 'page_view',
      event_category: 'engagement',
      event_label: 'Page Load',
      page_path: window.location.pathname
    });

    console.log('GTM initialized successfully');
  }
};

// Declare global dataLayer for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
  }
}
