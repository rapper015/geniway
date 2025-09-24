'use client';

import React from 'react';
import { ProfileCollectionModal } from './ProfileCollectionModal';
import { useProfileCollection } from '../contexts/ProfileCollectionContext';

export function ProfileCollectionWrapper() {
  const {
    showProfileModal,
    pendingProfileData,
    closeProfileModal,
    submitProfile
  } = useProfileCollection();

  return (
    <ProfileCollectionModal
      isOpen={showProfileModal}
      onClose={closeProfileModal}
      onSubmit={submitProfile}
      userData={pendingProfileData}
    />
  );
}
