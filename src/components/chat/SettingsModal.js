'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Modal, { ModalHeader, ModalBody, ModalFooter } from '../ui/Modal';
import {
  Settings,
  User,
  Sparkles,
  MessageSquare,
  Bell,
  Shield,
  ChevronDown,
  ChevronRight,
  Save,
  Download,
  Trash2
} from 'lucide-react';

const boards = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other'];
const stateBoards = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh'
];

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Hindi', 'Social Science', 'Computer Science', 'Sanskrit'
];

const languages = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi',
  'Gujarati', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'
];

export default function SettingsModal({ isOpen, onClose, trigger }) {
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({
    profile: false,
    personalization: false,
    chat: false,
    notifications: false,
    privacy: false
  });

  // Get effective user ID
  const effectiveUserId = useMemo(() => {
    if (isAuthenticated && user) {
      return user.id;
    } else if (isGuest && guestUser) {
      return guestUser.id;
    } else {
      let guestUuid = localStorage.getItem('guest_uuid');
      if (!guestUuid) {
        guestUuid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('guest_uuid', guestUuid);
      }
      return guestUuid;
    }
  }, [isAuthenticated, user, isGuest, guestUser]);

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && effectiveUserId) {
      loadProfile();
    }
  }, [isOpen, effectiveUserId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${effectiveUserId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setUserData(data.user);
      } else {
        // Create default profile for new users
        const defaultProfile = {
          user_id: effectiveUserId,
          first_name: '',
          last_name: '',
          preferred_name: '',
          whatsapp_number: '',
          state: '',
          city: '',
          board: 'CBSE',
          grade: null,
          subjects: [],
          lang_pref: 'en',
          teaching_language: 'English',
          pace: 'Normal',
          learning_style: 'Text',
          learning_styles: ['Text'],
          content_mode: 'step-by-step',
          fast_track_enabled: false,
          save_chat_history: true,
          study_streaks_enabled: true,
          break_reminders_enabled: true,
          mastery_nudges_enabled: true,
          data_sharing_enabled: false
        };
        setProfile(defaultProfile);
        setUserData({
          id: effectiveUserId,
          email: isAuthenticated ? user?.email : `${effectiveUserId}@geniway.com`,
          role: 'student',
          age_band: '11-14'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Create default profile on error
      const defaultProfile = {
        user_id: effectiveUserId,
        first_name: '',
        last_name: '',
        preferred_name: '',
        whatsapp_number: '',
        state: '',
        city: '',
        board: 'CBSE',
        grade: null,
        subjects: [],
        lang_pref: 'en',
        teaching_language: 'English',
        pace: 'Normal',
        learning_style: 'Text',
        learning_styles: ['Text'],
        content_mode: 'step-by-step',
        fast_track_enabled: false,
        save_chat_history: true,
        study_streaks_enabled: true,
        break_reminders_enabled: true,
        mastery_nudges_enabled: true,
        data_sharing_enabled: false
      };
      setProfile(defaultProfile);
      setUserData({
        id: effectiveUserId,
        email: isAuthenticated ? user?.email : `${effectiveUserId}@geniway.com`,
        role: 'student',
        age_band: '11-14'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const updateData = {
        ...profile,
        ...(userData?.email && { email: userData.email })
      };

      const response = await fetch(`/api/profile/${effectiveUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setProfile(data.profile);
        }
        if (data.user) {
          setUserData(data.user);
        }
        
        // Show success message
        alert('Settings saved successfully!');
      } else {
        throw new Error(`Failed to save profile: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async (format) => {
    try {
      const response = await fetch(`/api/profile/${effectiveUserId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        alert(`Your data export (${format.toUpperCase()}) has been initiated.`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const clearChatHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/profile/${effectiveUserId}/chats`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('All chat history has been permanently deleted.');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => {
      const newState = { ...prev };
      // Close all sections first
      Object.keys(newState).forEach(key => {
        newState[key] = false;
      });
      // Open the clicked section if it wasn't already open
      newState[section] = !prev[section];
      return newState;
    });
  };

  const updateProfile = (updates) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const toggleSubject = (subject) => {
    const currentSubjects = profile?.subjects || [];
    const newSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject];
    updateProfile({ subjects: newSubjects });
  };

  const autoDetectLocation = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          updateProfile({
            state: 'Auto-detected',
            city: 'Location detection in progress...'
          });
          alert('Attempting to detect your location...');
        }, (error) => {
          alert('Location detection failed. Please select your location manually.');
        });
      }
    } catch (error) {
      console.error('Location detection error:', error);
    }
  };

  if (!profile) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
        <ModalBody>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Failed to load settings. Please try again.</p>
              <button 
                onClick={loadProfile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </ModalBody>
      </Modal>
    );
  }

  const getCollapsedSummary = (section) => {
    switch (section) {
      case 'profile':
        return `${profile.first_name || ''} ${profile.last_name || ''} • Grade ${profile.grade || 'Not set'} • ${profile.board || 'Board not set'} • ${profile.lang_pref || 'English'}`;
      case 'personalization':
        const learningStylesText = profile.learning_styles && profile.learning_styles.length > 0
          ? profile.learning_styles.join(', ')
          : profile.learning_style || 'Not set';
        const contentModeText = profile.content_mode === 'quick-answer' ? 'Quick Answer' : 'Step-by-step';
        return `${profile.teaching_language || 'English'} • ${learningStylesText} • ${contentModeText}`;
      case 'chat':
        return `Save Chat History: ${profile.save_chat_history ? 'On' : 'Off'}`;
      case 'notifications':
        const activeCount = [
          profile.study_streaks_enabled,
          profile.break_reminders_enabled,
          profile.mastery_nudges_enabled
        ].filter(Boolean).length;
        return activeCount > 0 ? `${activeCount} reminders active` : 'All notifications off';
      case 'privacy':
        return `Data Sharing: ${profile.data_sharing_enabled ? 'On' : 'Off'}`;
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">Settings</span>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('profile')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <span className="font-medium">👤 Profile</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 truncate max-w-[200px]">
                  {getCollapsedSummary('profile')}
                </span>
                {openSections.profile ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>
            {openSections.profile && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profile.first_name || ''}
                      onChange={(e) => updateProfile({ first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profile.last_name || ''}
                      onChange={(e) => updateProfile({ last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Name</label>
                  <input
                    type="text"
                    value={profile.preferred_name || ''}
                    onChange={(e) => updateProfile({ preferred_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How would you like to be called?"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      value={profile.grade || ''}
                      onChange={(e) => updateProfile({ grade: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select grade</option>
                      {[6, 7, 8, 9, 10, 11, 12].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
                    <select
                      value={profile.board || ''}
                      onChange={(e) => updateProfile({ board: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {boards.map(board => (
                        <option key={board} value={board}>{board}</option>
                      ))}
                    </select>
                    {profile.board === 'State Board' && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select State Board</label>
                        <select
                          value={profile.state || ''}
                          onChange={(e) => updateProfile({ state: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select state</option>
                          {stateBoards.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1 rounded-full text-sm border ${
                          profile.subjects?.includes(subject)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userData?.email || ''}
                    onChange={(e) => setUserData(prev => prev ? { ...prev, email: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email address"
                  />
                  {userData?.email?.startsWith('guest_') && (
                    <p className="text-xs text-gray-600 mt-1">
                      Update your email to save your profile permanently
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={profile.whatsapp_number || ''}
                    onChange={(e) => updateProfile({ whatsapp_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <button
                        type="button"
                        onClick={autoDetectLocation}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Auto-detect
                      </button>
                    </div>
                    {profile.board !== 'State Board' ? (
                      <select
                        value={profile.state || ''}
                        onChange={(e) => updateProfile({ state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select state</option>
                        {indianStates.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={profile.state || ''}
                        onChange={(e) => updateProfile({ state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="State set by board selection"
                        disabled={profile.board === 'State Board'}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Town</label>
                    <input
                      type="text"
                      value={profile.city || ''}
                      onChange={(e) => updateProfile({ city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city or town"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Language (UI)</label>
                  <select
                    value={profile.lang_pref || 'en'}
                    onChange={(e) => updateProfile({ lang_pref: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Personalization Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('personalization')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">✨ Personalization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('personalization')}
                </span>
                {openSections.personalization ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>
            {openSections.personalization && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'Visual', label: 'Visual', icon: '👁️' },
                      { value: 'Voice', label: 'Voice/Audio', icon: '🎧' },
                      { value: 'Text', label: 'Text/Reading', icon: '📖' },
                      { value: 'Kinesthetic', label: 'Hands-on', icon: '🤲' }
                    ].map(style => {
                      const isSelected = profile.learning_styles?.includes(style.value) ||
                                       (profile.learning_style === style.value);
                      return (
                        <button
                          key={style.value}
                          onClick={() => {
                            const currentStyles = profile.learning_styles ||
                                                (profile.learning_style ? [profile.learning_style] : []);
                            const newStyles = isSelected
                              ? currentStyles.filter(s => s !== style.value)
                              : [...currentStyles, style.value];
                            updateProfile({
                              learning_styles: newStyles,
                              learning_style: newStyles[0] || null
                            });
                          }}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm">{style.icon}</span>
                          <span className="text-sm">{style.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Mode</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'step-by-step', label: 'Step-by-step', icon: '📚', desc: 'Detailed explanations with examples' },
                      { value: 'quick-answer', label: 'Quick Answer', icon: '⚡', desc: 'Direct answers without lengthy explanations' }
                    ].map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => updateProfile({ content_mode: mode.value })}
                        className={`flex flex-col items-center gap-1 flex-1 h-auto py-3 px-4 rounded-lg border ${
                          profile.content_mode === mode.value
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                        title={mode.desc}
                      >
                        <span className="text-lg">{mode.icon}</span>
                        <span className="text-xs">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Choose how detailed explanations should be by default
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pace</label>
                  <div className="flex gap-2">
                    {['Fast', 'Normal', 'Detailed'].map(pace => (
                      <button
                        key={pace}
                        onClick={() => updateProfile({ pace: pace })}
                        className={`flex-1 px-4 py-2 rounded-lg border ${
                          profile.pace === pace
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pace}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teaching Language</label>
                  <select
                    value={profile.teaching_language || 'English'}
                    onChange={(e) => updateProfile({ teaching_language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Chat & History Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('chat')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">💬 Chat & History</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('chat')}
                </span>
                {openSections.chat ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>
            {openSections.chat && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Save Chat History</label>
                    <p className="text-sm text-gray-600">Keep record of your conversations for future reference</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.save_chat_history || false}
                      onChange={(e) => updateProfile({ save_chat_history: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Export Notes</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('pdf')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => exportData('email')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Email Notes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clear All Chats</label>
                  <p className="text-sm text-gray-600 mb-2">Permanently delete all chat history</p>
                  <button
                    onClick={clearChatHistory}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All Chats
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('notifications')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <span className="font-medium">🔔 Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('notifications')}
                </span>
                {openSections.notifications ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>
            {openSections.notifications && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Study Streaks</label>
                    <p className="text-sm text-gray-600">Get notified about your learning streaks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.study_streaks_enabled || false}
                      onChange={(e) => updateProfile({ study_streaks_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Break Reminders</label>
                    <p className="text-sm text-gray-600">Reminders to take regular study breaks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.break_reminders_enabled || false}
                      onChange={(e) => updateProfile({ break_reminders_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mastery Nudges</label>
                    <p className="text-sm text-gray-600">Suggestions based on your learning progress</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.mastery_nudges_enabled || false}
                      onChange={(e) => updateProfile({ mastery_nudges_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Data Section */}
          <div className="border rounded-lg">
            <button
              onClick={() => toggleSection('privacy')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5" />
                <span className="font-medium">🔒 Privacy & Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('privacy')}
                </span>
                {openSections.privacy ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>
            {openSections.privacy && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Sharing</label>
                    <p className="text-sm text-gray-600">We use anonymized data to improve learning</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.data_sharing_enabled || false}
                      onChange={(e) => updateProfile({ data_sharing_enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Compliance:</strong> DPDP (India) & FERPA-ready (future).
                    Your privacy is protected according to applicable data protection laws.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}