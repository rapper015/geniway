'use client';

import { useState } from 'react';
import Modal, { ModalHeader, ModalBody } from '../ui/Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isLoginMode, setIsLoginMode] = useState(true);


  const handleAuthSuccess = (user, token) => {
    onAuthSuccess(user, token);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isLoginMode ? 'Sign In' : 'Create Account'} 
      size={isLoginMode ? 'md' : 'lg'}
    >
      <ModalBody>
        {isLoginMode ? (
          <LoginForm 
            onToggleMode={() => setIsLoginMode(false)}
            onLogin={handleAuthSuccess}
          />
        ) : (
          <RegisterForm 
            onToggleMode={() => setIsLoginMode(true)}
            onRegister={handleAuthSuccess}
          />
        )}
      </ModalBody>
    </Modal>
  );
}
