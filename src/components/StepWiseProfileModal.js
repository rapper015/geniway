'use client';

import React, { useState } from 'react';
import Modal from './ui/Modal';
import { gtmEvents } from '../lib/gtm';

// Individual step modals for profile collection
export function NameStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [formData, setFormData] = useState({
    firstName: userData.firstName || '',
    lastName: userData.lastName || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.firstName.trim()) {
      // Track onboarding start
      gtmEvents.userOnboardingStart(localStorage.getItem('currentSessionId'));
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's your name?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          I'd love to know your name so I can personalize our learning experience!
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your last name"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!formData.firstName.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function RoleStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedRole, setSelectedRole] = useState(userData.role || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRole) {
      onSubmit({ role: selectedRole });
      onClose();
    }
  };

  const roles = [
    { value: 'student', label: 'Student', description: 'I\'m learning and studying' },
    { value: 'parent', label: 'Parent', description: 'I\'m helping my child learn' },
    { value: 'teacher', label: 'Teacher', description: 'I\'m teaching students' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tell us about yourself">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          Are you a student, parent, or teacher?
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {roles.map((role) => (
            <label key={role.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">{role.label}</div>
                <div className="text-sm text-gray-600">{role.description}</div>
              </div>
            </label>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedRole}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function GradeStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedGrade, setSelectedGrade] = useState(userData.grade || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedGrade) {
      onSubmit({ grade: selectedGrade });
      onClose();
    }
  };

  const grades = ['6', '7', '8', '9', '10', '11', '12'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What grade are you in?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          This helps me provide age-appropriate content for you.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {grades.map((grade) => (
              <label key={grade} className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="grade"
                  value={grade}
                  checked={selectedGrade === grade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="mr-2"
                />
                <span className="font-medium">Grade {grade}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedGrade}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function BoardStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedBoard, setSelectedBoard] = useState(userData.board || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBoard) {
      onSubmit({ board: selectedBoard });
      onClose();
    }
  };

  const boards = [
    { value: 'CBSE', label: 'CBSE' },
    { value: 'ICSE', label: 'ICSE' },
    { value: 'State Board', label: 'State Board' },
    { value: 'IB', label: 'IB (International Baccalaureate)' },
    { value: 'IGCSE', label: 'IGCSE' },
    { value: 'Other', label: 'Other' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Which board are you studying under?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          This helps me provide curriculum-specific content.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {boards.map((board) => (
            <label key={board.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="board"
                value={board.value}
                checked={selectedBoard === board.value}
                onChange={(e) => setSelectedBoard(e.target.value)}
              />
              <span className="font-medium">{board.label}</span>
            </label>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedBoard}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function SubjectsStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedSubjects, setSelectedSubjects] = useState(userData.subjects || []);

  const handleSubjectChange = (subject, checked) => {
    if (checked) {
      setSelectedSubjects(prev => [...prev, subject]);
    } else {
      setSelectedSubjects(prev => prev.filter(s => s !== subject));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSubjects.length > 0) {
      onSubmit({ subjects: selectedSubjects });
      onClose();
    }
  };

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'Hindi', 'Social Studies', 'History', 'Geography', 'Economics',
    'Computer Science', 'Physical Education', 'Art', 'Music'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Which subjects interest you?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          Select the subjects you're most interested in learning about.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((subject) => (
              <label key={subject} className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{subject}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={selectedSubjects.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function LearningStyleStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedStyle, setSelectedStyle] = useState(userData.learningStyle || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedStyle) {
      onSubmit({ learningStyle: selectedStyle });
      onClose();
    }
  };

  const styles = [
    { value: 'visual', label: 'Visual', description: 'I learn best by seeing diagrams, charts, and images' },
    { value: 'auditory', label: 'Voice/Audio', description: 'I learn best by listening and hearing explanations' },
    { value: 'text', label: 'Text/Reading', description: 'I learn best by reading and written explanations' },
    { value: 'hands-on', label: 'Hands-on', description: 'I learn best by doing activities and experiments' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How do you prefer to learn?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          This helps me present information in the way you learn best.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {styles.map((style) => (
            <label key={style.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="learningStyle"
                value={style.value}
                checked={selectedStyle === style.value}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">{style.label}</div>
                <div className="text-sm text-gray-600">{style.description}</div>
              </div>
            </label>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedStyle}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function PaceStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [selectedPace, setSelectedPace] = useState(userData.pace || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPace) {
      onSubmit({ pace: selectedPace });
      onClose();
    }
  };

  const paces = [
    { value: 'fast', label: 'Fast', description: 'Quick answers and summaries' },
    { value: 'normal', label: 'Normal', description: 'Balanced explanations' },
    { value: 'detailed', label: 'Detailed', description: 'Thorough and comprehensive explanations' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="What's your preferred learning pace?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          This helps me adjust the depth of my explanations.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {paces.map((pace) => (
            <label key={pace.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="pace"
                value={pace.value}
                checked={selectedPace === pace.value}
                onChange={(e) => setSelectedPace(e.target.value)}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">{pace.label}</div>
                <div className="text-sm text-gray-600">{pace.description}</div>
              </div>
            </label>
          ))}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedPace}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function LocationStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [formData, setFormData] = useState({
    state: userData.state || '',
    city: userData.city || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.state.trim()) {
      onSubmit(formData);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Where are you from?">
      <div className="max-w-md mx-auto p-6">
        <p className="text-gray-600 mb-6">
          This helps me provide more relevant examples and local context.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your state"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your city"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!formData.state.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function EmailStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [formData, setFormData] = useState({
    email: userData.email || ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate email
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit with email
    onSubmit({ email: formData.email });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Your Account">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Let's Create Your Account!
          </h3>

          <p className="text-gray-600">
            I see your profile is complete! Let's create an account so you can save your progress and access it from anywhere.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Your Account Benefits:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save your learning progress</li>
              <li>• Access your profile from any device</li>
              <li>• Get personalized recommendations</li>
              <li>• Track your learning journey</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function PasswordStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit with password
    onSubmit({ password: formData.password });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Your Account">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Almost Done!
          </h3>
          
          <p className="text-gray-600">
            Just one more step - create a password for your account so you can access your personalized learning profile anytime.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Your Account Benefits:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Save your learning progress</li>
              <li>• Access your profile from any device</li>
              <li>• Get personalized recommendations</li>
              <li>• Track your learning journey</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function CompleteStepModal({ isOpen, onClose, onSubmit, userData = {} }) {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // Get the complete profile data
      const existingProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
      const completeProfile = { ...existingProfile, ...userData };
      
      // Map profile data to valid enum values
      const validSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Sanskrit'];
      const filteredSubjects = (completeProfile.subjects || []).filter(subject => 
        validSubjects.includes(subject)
      );
      
      // Map learning style to valid enum
      const mapLearningStyle = (style) => {
        const styleMap = {
          'visual': 'Visual',
          'voice': 'Voice', 
          'text': 'Text',
          'kinesthetic': 'Kinesthetic'
        };
        return styleMap[style?.toLowerCase()] || 'Text';
      };
      
      // Map pace to valid enum
      const mapPace = (pace) => {
        const paceMap = {
          'fast': 'Fast',
          'normal': 'Normal',
          'detailed': 'Detailed'
        };
        return paceMap[pace?.toLowerCase()] || 'Normal';
      };

      // Prepare the request data
      const requestData = {
        firstName: completeProfile.firstName,
        lastName: completeProfile.lastName,
        email: completeProfile.email,
        password: completeProfile.password,
        role: completeProfile.role,
        grade: completeProfile.grade,
        board: completeProfile.board || 'CBSE',
        subjects: filteredSubjects,
        learningStyle: mapLearningStyle(completeProfile.learningStyle),
        learningStyles: [mapLearningStyle(completeProfile.learningStyle)],
        pace: mapPace(completeProfile.pace),
        state: completeProfile.state || '',
        city: completeProfile.city || '',
        teachingLanguage: 'English',
        contentMode: 'step-by-step',
        fastTrackEnabled: false,
        saveChatHistory: true,
        studyStreaksEnabled: true,
        breakRemindersEnabled: true,
        masteryNudgesEnabled: true,
        dataSharingEnabled: false,
        isGuest: false // Creating a real account
      };

      // Make API call directly for account creation
      const response = await fetch('/api/auth/auto-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      
      if (response.ok) {
        const data = await response.json();
        
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Mark account as created in profile
        const updatedProfile = { ...completeProfile, accountCreated: true };
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
        // Save current chat history to localStorage before account creation
        const currentChat = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        // Save chat history to database
        try {
          const chatResponse = await fetch('/api/chat/save-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({
              messages: currentChat,
              sessionId: localStorage.getItem('currentSessionId') || null
            })
          });
          
          if (chatResponse.ok) {
          } else {
            console.error('[CompleteStepModal] Failed to save chat history to database');
          }
        } catch (chatError) {
          console.error('[CompleteStepModal] Error saving chat history:', chatError);
        }
        
        // Track successful account creation
        gtmEvents.userOnboardingComplete(data.user.id, completeProfile.email, localStorage.getItem('currentSessionId'));
        gtmEvents.profileCreated(data.user.id, completeProfile.email, localStorage.getItem('currentSessionId'));
        
        // Show success message
        alert(`Account created successfully! Welcome, ${completeProfile.firstName}! Your chat history has been saved.`);
        
        // Don't reload page - just close the modal
        // The chat will continue with the new authenticated user
      } else {
        const errorData = await response.json();
        console.error('[CompleteStepModal] API error:', errorData);
        alert(`Error creating account: ${errorData.error || 'Unknown error'}`);
      }
      
      onClose();
    } catch (error) {
      console.error('[CompleteStepModal] Error completing profile:', error);
      alert('Sorry, there was an error creating your account. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Your Profile">
      <div className="max-w-md mx-auto p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Profile Complete!
          </h3>
          
          <p className="text-gray-600 mb-6">
            Perfect! I have all the information I need to create your personalized learning profile. 
            Let me set up your account so I can provide you with the best learning experience!
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your account will be created automatically</li>
              <li>• I'll personalize all my responses based on your profile</li>
              <li>• You'll get age-appropriate explanations</li>
              <li>• I'll use examples relevant to your location and interests</li>
            </ul>
          </div>
          
          <div className="flex justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? 'Creating Account...' : 'Create My Account'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
