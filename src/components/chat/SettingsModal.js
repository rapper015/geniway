'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  'English', 'Hindi', 'Hinglish'
];

export default function SettingsModal({ isOpen, onClose, trigger, localProfileData = {} }) {
  const { user, isAuthenticated, isGuest, guestUser, refreshUser } = useAuth();
  const { language, changeLanguage, getLanguageDisplayName } = useLanguage();
  
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const hasLoadedRef = useRef(false);
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
      const userId = user._id || user.id;
      return userId;
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

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      
      let profileData = {};
      let userInfo = {};

      if (isAuthenticated && user) {
        // Use authenticated user data
        profileData = {
          user_id: user._id || user.id,
          first_name: user.firstName || user.first_name || '',
          last_name: user.lastName || user.last_name || '',
          name: user.name || '',
          preferred_name: user.preferredName || user.preferred_name || '',
          whatsapp_number: user.whatsappNumber || user.whatsapp_number || '',
          state: user.state || '',
          city: user.city || '',
          board: user.board || 'CBSE',
          grade: user.grade || null,
          subjects: user.subjects || [],
          lang_pref: user.langPref || user.lang_pref || 'en',
          teaching_language: user.teachingLanguage || user.teaching_language || 'English',
          pace: user.pace || 'Normal',
          learning_style: user.learningStyle || user.learning_style || 'Text',
          learning_styles: user.learningStyles || user.learning_styles || ['Text'],
          content_mode: user.contentMode || user.content_mode || 'step-by-step',
          fast_track_enabled: user.fastTrackEnabled || user.fast_track_enabled || false,
          save_chat_history: user.saveChatHistory !== undefined ? user.saveChatHistory : true,
          study_streaks_enabled: user.studyStreaksEnabled !== undefined ? user.studyStreaksEnabled : true,
          break_reminders_enabled: user.breakRemindersEnabled !== undefined ? user.breakRemindersEnabled : true,
          mastery_nudges_enabled: user.masteryNudgesEnabled !== undefined ? user.masteryNudgesEnabled : true,
          data_sharing_enabled: user.dataSharingEnabled || user.data_sharing_enabled || false
        };

        userInfo = {
          id: user._id || user.id,
          email: user.email || '',
          role: user.role || 'student',
          name: user.name || 'User'
        };
      } else {
        // Use local profile data for guest users
        profileData = {
          user_id: effectiveUserId,
          first_name: localProfileData.firstName || '',
          last_name: localProfileData.lastName || '',
          name: localProfileData.name || '',
          preferred_name: '',
          whatsapp_number: '',
          state: localProfileData.state || '',
          city: localProfileData.city || '',
          board: localProfileData.board || 'CBSE',
          grade: localProfileData.grade || null,
          subjects: localProfileData.subjects || [],
          lang_pref: 'en',
          teaching_language: 'English',
          pace: localProfileData.pace || 'Normal',
          learning_style: localProfileData.learningStyle || 'Text',
          learning_styles: localProfileData.learningStyles || ['Text'],
          content_mode: 'step-by-step',
          fast_track_enabled: false,
          save_chat_history: true,
          study_streaks_enabled: true,
          break_reminders_enabled: true,
          mastery_nudges_enabled: true,
          data_sharing_enabled: false
        };

        userInfo = {
          id: effectiveUserId,
          email: `${effectiveUserId}@geniway.com`,
          role: localProfileData.role || 'student',
          name: localProfileData.name || 'Guest User'
        };
      }
      
      setProfile(profileData);
      setUserData(userInfo);
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, isGuest, guestUser, effectiveUserId, localProfileData]);

  // Load profile data when modal opens
  useEffect(() => {
    if (isOpen && !hasLoadedRef.current) {
      setLoadError(false); // Reset error state when modal opens
      hasLoadedRef.current = true;
      
      // Load profile directly without calling refreshUser to avoid infinite loop
      loadProfile();
    } else if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen]); // Only depend on isOpen to avoid infinite loops

  // Refresh user data when modal opens (only for authenticated users)
  useEffect(() => {
    if (isOpen && isAuthenticated && refreshUser) {
      refreshUser().catch(error => {
        console.error('[SettingsModal] Error refreshing user data:', error);
      });
    }
  }, [isOpen, isAuthenticated]); // Only depend on isOpen and isAuthenticated

  // Fallback: If profile is still null after modal opens, create basic profile
  useEffect(() => {
    if (isOpen && !profile && !loading && !loadError) {
      
      let fallbackProfile = {};
      let fallbackUserInfo = {};
      
      if (isAuthenticated && user) {
        // Create profile from authenticated user data
        fallbackProfile = {
          user_id: user._id || user.id,
          first_name: user.firstName || user.first_name || '',
          last_name: user.lastName || user.last_name || '',
          name: user.name || '',
          preferred_name: user.preferredName || user.preferred_name || '',
          whatsapp_number: user.whatsappNumber || user.whatsapp_number || '',
          state: user.state || '',
          city: user.city || '',
          board: user.board || 'CBSE',
          grade: user.grade || null,
          subjects: user.subjects || [],
          lang_pref: user.langPref || user.lang_pref || 'en',
          teaching_language: user.teachingLanguage || user.teaching_language || 'English',
          pace: user.pace || 'Normal',
          learning_style: user.learningStyle || user.learning_style || 'Text',
          learning_styles: user.learningStyles || user.learning_styles || ['Text'],
          content_mode: user.contentMode || user.content_mode || 'step-by-step',
          fast_track_enabled: user.fastTrackEnabled || user.fast_track_enabled || false,
          save_chat_history: user.saveChatHistory !== undefined ? user.saveChatHistory : true,
          study_streaks_enabled: user.studyStreaksEnabled !== undefined ? user.studyStreaksEnabled : true,
          break_reminders_enabled: user.breakRemindersEnabled !== undefined ? user.breakRemindersEnabled : true,
          mastery_nudges_enabled: user.masteryNudgesEnabled !== undefined ? user.masteryNudgesEnabled : true,
          data_sharing_enabled: user.dataSharingEnabled || user.data_sharing_enabled || false
        };
        
        fallbackUserInfo = {
          id: user._id || user.id,
          email: user.email || '',
          role: user.role || 'student',
          name: user.name || 'User'
        };
      } else {
        // Create profile from localStorage guest data
        const guestProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
        const effectiveId = effectiveUserId || 'guest_user';
        
        fallbackProfile = {
          user_id: effectiveId,
          first_name: guestProfile.firstName || '',
          last_name: guestProfile.lastName || '',
          name: guestProfile.name || '',
          preferred_name: '',
          whatsapp_number: '',
          state: guestProfile.state || '',
          city: guestProfile.city || '',
          board: guestProfile.board || 'CBSE',
          grade: guestProfile.grade || null,
          subjects: guestProfile.subjects || [],
          lang_pref: 'en',
          teaching_language: 'English',
          pace: guestProfile.pace || 'Normal',
          learning_style: guestProfile.learningStyle || 'Text',
          learning_styles: guestProfile.learningStyles || ['Text'],
          content_mode: 'step-by-step',
          fast_track_enabled: false,
          save_chat_history: true,
          study_streaks_enabled: true,
          break_reminders_enabled: true,
          mastery_nudges_enabled: true,
          data_sharing_enabled: false
        };
        
        fallbackUserInfo = {
          id: effectiveId,
          email: `${effectiveId}@geniway.com`,
          role: guestProfile.role || 'student',
          name: guestProfile.name || 'Guest User'
        };
      }
      
      setProfile(fallbackProfile);
      setUserData(fallbackUserInfo);
      setLoading(false);
    }
  }, [isOpen, profile, loading, loadError, isAuthenticated, user, effectiveUserId]);

  const saveProfile = async () => {
    if (!profile) {
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...profile,
        ...(userData?.email && { email: userData.email })
      };
      
      // For guest users, just save to localStorage
      if (isGuest || !isAuthenticated) {
        localStorage.setItem('guestProfile', JSON.stringify(updateData));
        
        // Update local state
        setProfile(updateData);
        
        // Show success message
        alert('Settings saved successfully! (Saved locally)');
        return;
      }

      // For authenticated users, make API call
      
      const response = await fetch(`/api/profile/${effectiveUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response formats
        if (data.profile && data.user) {
          // Standard format with both profile and user
          setProfile(data.profile);
          setUserData(data.user);
          
          // Update localStorage with new user data
          localStorage.setItem('user', JSON.stringify(data.user));
        } else if (data.user) {
          // User data now contains all profile information
          const userData = data.user;
          setUserData(userData);
          
          // Create profile object from user data (for backward compatibility)
          const profileData = {
            user_id: userData._id || userData.id,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            name: userData.name || '',
            preferred_name: userData.preferredName || '',
            whatsapp_number: userData.whatsappNumber || '',
            phone_number: userData.phoneNumber || '',
            state: userData.state || '',
            city: userData.city || '',
            school: userData.school || '',
            board: userData.board || 'CBSE',
            grade: userData.grade || null,
            subjects: userData.subjects || [],
            lang_pref: userData.langPref || 'en',
            teaching_language: userData.teachingLanguage || 'English',
            pace: userData.pace || 'Normal',
            learning_style: userData.learningStyle || 'Text',
            learning_styles: userData.learningStyles || ['Text'],
            content_mode: userData.contentMode || 'step-by-step',
            fast_track_enabled: userData.fastTrackEnabled || false,
            save_chat_history: userData.saveChatHistory !== false,
            study_streaks_enabled: userData.studyStreaksEnabled !== false,
            break_reminders_enabled: userData.breakRemindersEnabled !== false,
            mastery_nudges_enabled: userData.masteryNudgesEnabled !== false,
            data_sharing_enabled: userData.dataSharingEnabled || false,
            is_guest: userData.isGuest || false,
            age_band: userData.ageBand || '11-14',
            profile_completion_step: userData.profileCompletionStep || 0,
            profile_completed: userData.profileCompleted || false,
            total_questions_asked: userData.totalQuestionsAsked || 0,
            total_quizzes_completed: userData.totalQuizzesCompleted || 0,
            average_quiz_score: userData.averageQuizScore || 0,
            last_active_session: userData.lastActiveSession || new Date(),
            total_sessions: userData.totalSessions || 0,
            preferences: userData.preferences || { language: 'en', notifications: true },
            created_at: userData.createdAt,
            updated_at: userData.updatedAt
          };
          
          setProfile(profileData);
          
          // Update localStorage with new user data
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.error('[SettingsModal] Unexpected API response format:', data);
          setLoadError(true);
        }
        
        // Refresh user data in AuthContext
        if (refreshUser) {
          await refreshUser();
        }
        
        // Show success message
        alert('Settings saved successfully!');
      } else {
        const errorText = await response.text();
        console.error('[SettingsModal] API error response:', errorText);
        throw new Error(`Failed to save profile: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('[SettingsModal] Error saving profile:', error);
      console.error('[SettingsModal] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const exportData = async (format) => {
    try {
      // For guest users, export from localStorage
      if (isGuest || !isAuthenticated) {
        const guestProfile = JSON.parse(localStorage.getItem('guestProfile') || '{}');
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        
        const exportData = {
          profile: guestProfile,
          chatHistory: chatHistory,
          exportDate: new Date().toISOString(),
          format: format
        };
        
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `geniway-guest-data-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          // For other formats, just show the data
          alert(`Guest data export (${format.toUpperCase()}):\n\nProfile: ${JSON.stringify(guestProfile, null, 2)}\n\nChat History: ${chatHistory.length} messages`);
        }
        
        alert(`Your guest data has been exported in ${format.toUpperCase()} format.`);
        return;
      }

      // For authenticated users, make API call
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
      // For guest users, clear from localStorage
      if (isGuest || !isAuthenticated) {
        localStorage.removeItem('chatHistory');
        localStorage.removeItem('currentSessionId');
        alert('All chat history has been cleared from your local storage.');
        return;
      }

      // For authenticated users, make API call
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

  if (!profile && !loading && loadError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
        <ModalBody>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Failed to load settings. Please try again.</p>
            <button 
              onClick={loadProfile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  if (!profile && loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
        <ModalBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  const getCollapsedSummary = (section) => {
    if (!profile) {
      return 'Loading...';
    }
    
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
        {!profile ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Language</label>
                  <select
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="english">English</option>
                    <option value="hindi">हिंदी (Hindi)</option>
                    <option value="hinglish">Hinglish</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Choose the language for AI responses
                  </p>
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
        )}
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