'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncService } from '../lib/syncService';

const ProfileCollectionContext = createContext();

export function ProfileCollectionProvider({ children }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState({});
  const [hasShownProfileModal, setHasShownProfileModal] = useState(false);
  
  // Step-wise modal states
  const [currentStep, setCurrentStep] = useState(null);
  const [showStepModal, setShowStepModal] = useState(false);
  const [stepProfileData, setStepProfileData] = useState({});
  const [onStepComplete, setOnStepComplete] = useState(null);

  // Check if user has already completed profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompleted = localStorage.getItem('profileCompleted');
      setHasShownProfileModal(hasCompleted === 'true');
    }
  }, []);

  const triggerProfileCollection = (data = {}) => {
    // Don't show if already completed or already shown in this session
    if (hasShownProfileModal || showProfileModal) {
      return;
    }
    
    setPendingProfileData(data);
    setShowProfileModal(true);
  };

  const triggerStepModal = (step, data = {}, onComplete = null) => {
    setCurrentStep(step);
    setStepProfileData(data);
    setOnStepComplete(onComplete);
    setShowStepModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setPendingProfileData({});
    setHasShownProfileModal(true);
    
    // Mark as completed in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileCompleted', 'true');
    }
  };

  const closeStepModal = () => {
    setShowStepModal(false);
    setCurrentStep(null);
    setStepProfileData({});
    setOnStepComplete(null);
  };

  const submitProfile = async (profileData) => {
    try {
      console.log('Submitting profile data:', profileData);
      
      // Save to localStorage for guest users
      localStorage.setItem('guestProfile', JSON.stringify(profileData));
      
      // If user is authenticated, save to API
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save profile');
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting profile:', error);
      throw error;
    }
  };

  const submitStepData = async (stepData) => {
    try {
      console.log('[ProfileCollectionContext] submitStepData called:', { stepData, currentStep, onStepComplete });
      
      // For 'complete' step, stepData is the complete profile
      if (currentStep === 'complete') {
        // Save the complete profile
        localStorage.setItem('guestProfile', JSON.stringify(stepData));
        
        // Call the completion callback if provided
        if (onStepComplete) {
          console.log('[ProfileCollectionContext] Calling complete step callback:', { currentStep, stepData });
          onStepComplete(currentStep, stepData);
        } else {
          console.log('[ProfileCollectionContext] No onStepComplete callback provided for complete step');
        }
        
        return true;
      }
      
      // For other steps, merge with existing profile data
      const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      const updatedProfile = { ...existingProfile, ...stepData };
      
      // Save to localStorage for guest users
      localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
      
      // If user is authenticated, sync to database using sync service
      const token = localStorage.getItem('token');
      if (token) {
        // Add to sync queue for optimal sync
        syncService.addToSyncQueue('updateProfile', stepData, 'high');
      }
      
      // Call the completion callback if provided and we have a valid step
      if (onStepComplete && currentStep) {
        console.log('[ProfileCollectionContext] Calling step completion callback:', { currentStep, stepData });
        onStepComplete(currentStep, stepData);
      } else {
        console.log('[ProfileCollectionContext] Not calling callback:', { onStepComplete: !!onStepComplete, currentStep });
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting step data:', error);
      throw error;
    }
  };

  return (
    <ProfileCollectionContext.Provider value={{
      showProfileModal,
      pendingProfileData,
      triggerProfileCollection,
      closeProfileModal,
      submitProfile,
      hasShownProfileModal,
      // Step-wise modal functions
      currentStep,
      showStepModal,
      stepProfileData,
      triggerStepModal,
      closeStepModal,
      submitStepData,
      setOnStepComplete
    }}>
      {children}
    </ProfileCollectionContext.Provider>
  );
}

export function useProfileCollection() {
  const context = useContext(ProfileCollectionContext);
  if (context === undefined) {
    throw new Error('useProfileCollection must be used within a ProfileCollectionProvider');
  }
  return context;
}