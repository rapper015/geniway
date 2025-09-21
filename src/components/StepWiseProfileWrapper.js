'use client';

import React from 'react';
import { useProfileCollection } from '../contexts/ProfileCollectionContext';
import {
  NameStepModal,
  RoleStepModal,
  GradeStepModal,
  BoardStepModal,
  SubjectsStepModal,
  LearningStyleStepModal,
  PaceStepModal,
  LocationStepModal,
  EmailStepModal,
  PasswordStepModal,
  CompleteStepModal
} from './StepWiseProfileModal';

export function StepWiseProfileWrapper() {
  const {
    currentStep,
    showStepModal,
    stepProfileData,
    closeStepModal,
    submitStepData
  } = useProfileCollection();

  const handleStepSubmit = async (data) => {
    try {
      await submitStepData(data);
      closeStepModal();
    } catch (error) {
      console.error('Error submitting step data:', error);
    }
  };

  const renderStepModal = () => {
    switch (currentStep) {
      case 'name':
        return (
          <NameStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'role_grade':
        return (
          <RoleStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'grade':
        return (
          <GradeStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'board':
        return (
          <BoardStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'subjects':
        return (
          <SubjectsStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'learning_style':
        return (
          <LearningStyleStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'pace':
        return (
          <PaceStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'location':
        return (
          <LocationStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'email':
        return (
          <EmailStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'password':
        return (
          <PasswordStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      case 'complete':
        return (
          <CompleteStepModal
            isOpen={showStepModal}
            onClose={closeStepModal}
            onSubmit={handleStepSubmit}
            userData={stepProfileData}
          />
        );
      default:
        return null;
    }
  };

  return renderStepModal();
}
