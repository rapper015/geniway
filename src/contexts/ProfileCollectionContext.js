'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileCollectionContext = createContext();

export function ProfileCollectionProvider({ children }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState({});
  const [hasShownProfileModal, setHasShownProfileModal] = useState(false);

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

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setPendingProfileData({});
    setHasShownProfileModal(true);
    
    // Mark as completed in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileCompleted', 'true');
    }
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

  return (
    <ProfileCollectionContext.Provider value={{
      showProfileModal,
      pendingProfileData,
      triggerProfileCollection,
      closeProfileModal,
      submitProfile,
      hasShownProfileModal
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
