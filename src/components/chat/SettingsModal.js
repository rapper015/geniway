'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  Trash2, 
  X,
  Loader2
} from 'lucide-react';

export default function SettingsModal({ trigger, isOpen, onClose }) {
  const { user, isAuthenticated, isGuest, guestUser } = useAuth();
  const [profile, setProfile] = useState(null);
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
    if (isAuthenticated && user) return user.id;
    if (isGuest && guestUser) return guestUser.id;
    const existing = localStorage.getItem('guest_uuid');
    if (existing) return existing;
    const gid = `guest_${Date.now()}`;
    localStorage.setItem('guest_uuid', gid);
    return gid;
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: user?.name || guestUser?.name || '',
          email: user?.email || '',
          role: user?.role || 'student',
          grade: user?.grade || '',
          school: user?.school || '',
          language: user?.preferences?.language || 'en',
          notifications: user?.preferences?.notifications ?? true,
          subjects: user?.preferences?.subjects || [],
          learningStyle: user?.preferences?.learningStyle || 'visual',
          pace: user?.preferences?.pace || 'normal',
          saveChatHistory: user?.preferences?.saveChatHistory ?? true,
          studyStreaks: user?.preferences?.studyStreaks ?? true,
          breakReminders: user?.preferences?.breakReminders ?? true,
          masteryNudges: user?.preferences?.masteryNudges ?? true,
          dataSharing: user?.preferences?.dataSharing ?? false
        });
      } else {
        // Create default profile
        setProfile({
          name: user?.name || guestUser?.name || '',
          email: user?.email || '',
          role: user?.role || 'student',
          grade: user?.grade || '',
          school: user?.school || '',
          language: 'en',
          notifications: true,
          subjects: [],
          learningStyle: 'visual',
          pace: 'normal',
          saveChatHistory: true,
          studyStreaks: true,
          breakReminders: true,
          masteryNudges: true,
          dataSharing: false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Create default profile on error
      setProfile({
        name: user?.name || guestUser?.name || '',
        email: user?.email || '',
        role: user?.role || 'student',
        grade: user?.grade || '',
        school: user?.school || '',
        language: 'en',
        notifications: true,
        subjects: [],
        learningStyle: 'visual',
        pace: 'normal',
        saveChatHistory: true,
        studyStreaks: true,
        breakReminders: true,
        masteryNudges: true,
        dataSharing: false
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          role: profile.role,
          grade: profile.grade,
          school: profile.school,
          preferences: {
            language: profile.language,
            notifications: profile.notifications,
            subjects: profile.subjects,
            learningStyle: profile.learningStyle,
            pace: profile.pace,
            saveChatHistory: profile.saveChatHistory,
            studyStreaks: profile.studyStreaks,
            breakReminders: profile.breakReminders,
            masteryNudges: profile.masteryNudges,
            dataSharing: profile.dataSharing
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local storage
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('Settings saved successfully!');
      } else {
        throw new Error('Failed to save profile');
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
      const response = await fetch('/api/profile/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format, userId: effectiveUserId }),
      });

      if (response.ok) {
        alert(`Data export (${format.toUpperCase()}) has been initiated.`);
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
      const response = await fetch('/api/chat/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: effectiveUserId }),
      });

      if (response.ok) {
        alert('Chat history has been cleared.');
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  const toggleSection = (section) => {
    setOpenSections(prev => {
      const newState = Object.keys(prev).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {});
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

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-3" />
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Failed to load settings. Please try again.</p>
            <button
              onClick={loadProfile}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getCollapsedSummary = (section) => {
    switch (section) {
      case 'profile':
        return `${profile.name || 'No name'} • Grade ${profile.grade || 'Not set'} • ${profile.role || 'Student'}`;
      case 'personalization':
        return `${profile.language || 'English'} • ${profile.learningStyle || 'Visual'} • ${profile.pace || 'Normal'}`;
      case 'chat':
        return `Save Chat History: ${profile.saveChatHistory ? 'On' : 'Off'}`;
      case 'notifications':
        const activeCount = [profile.studyStreaks, profile.breakReminders, profile.masteryNudges].filter(Boolean).length;
        return activeCount > 0 ? `${activeCount} notifications active` : 'All notifications off';
      case 'privacy':
        return `Data Sharing: ${profile.dataSharing ? 'On' : 'Off'}`;
      default:
        return '';
    }
  };

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'Hindi', 'Social Science', 'Computer Science', 'Sanskrit'
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी (Hindi)' },
    { value: 'ta', label: 'தமிழ் (Tamil)' },
    { value: 'bn', label: 'বাংলা (Bengali)' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Profile Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('profile')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span className="font-medium">👤 Profile</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('profile')}
                </span>
                {openSections.profile ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {openSections.profile && (
              <div className="p-4 space-y-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => updateProfile({ name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => updateProfile({ email: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={profile.role}
                      onChange={(e) => updateProfile({ role: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <input
                      type="text"
                      value={profile.grade}
                      onChange={(e) => updateProfile({ grade: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter grade/class"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                  <input
                    type="text"
                    value={profile.school}
                    onChange={(e) => updateProfile({ school: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter school name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => updateProfile({ language: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(subject => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          profile.subjects?.includes(subject)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Personalization Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('personalization')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">✨ Personalization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('personalization')}
                </span>
                {openSections.personalization ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {openSections.personalization && (
              <div className="p-4 space-y-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'visual', label: 'Visual', icon: '👁️' },
                      { value: 'auditory', label: 'Auditory', icon: '🎧' },
                      { value: 'reading', label: 'Reading', icon: '📖' },
                      { value: 'kinesthetic', label: 'Hands-on', icon: '🤲' }
                    ].map(style => (
                      <button
                        key={style.value}
                        onClick={() => updateProfile({ learningStyle: style.value })}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          profile.learningStyle === style.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg mb-1">{style.icon}</div>
                          <div className="text-sm font-medium">{style.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Pace</label>
                  <div className="flex gap-2">
                    {['slow', 'normal', 'fast'].map(pace => (
                      <button
                        key={pace}
                        onClick={() => updateProfile({ pace })}
                        className={`flex-1 p-3 rounded-lg border-2 transition-colors capitalize ${
                          profile.pace === pace
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {pace}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat & History Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('chat')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">💬 Chat & History</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('chat')}
                </span>
                {openSections.chat ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {openSections.chat && (
              <div className="p-4 space-y-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Save Chat History</label>
                    <p className="text-sm text-gray-600">Keep record of your conversations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.saveChatHistory}
                      onChange={(e) => updateProfile({ saveChatHistory: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Export Data</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportData('pdf')}
                      className="flex-1 flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => exportData('email')}
                      className="flex-1 flex items-center justify-center gap-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4" />
                      Email Notes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clear All Chats</label>
                  <button
                    onClick={clearChatHistory}
                    className="w-full flex items-center justify-center gap-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Chats
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('notifications')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <span className="font-medium">🔔 Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('notifications')}
                </span>
                {openSections.notifications ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {openSections.notifications && (
              <div className="p-4 space-y-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Study Streaks</label>
                    <p className="text-sm text-gray-600">Get notified about your learning streaks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.studyStreaks}
                      onChange={(e) => updateProfile({ studyStreaks: e.target.checked })}
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
                      checked={profile.breakReminders}
                      onChange={(e) => updateProfile({ breakReminders: e.target.checked })}
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
                      checked={profile.masteryNudges}
                      onChange={(e) => updateProfile({ masteryNudges: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Privacy & Data Section */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('privacy')}
              className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <span className="font-medium">🔒 Privacy & Data</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {getCollapsedSummary('privacy')}
                </span>
                {openSections.privacy ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {openSections.privacy && (
              <div className="p-4 space-y-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Sharing</label>
                    <p className="text-sm text-gray-600">We use anonymized data to improve learning</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.dataSharing}
                      onChange={(e) => updateProfile({ dataSharing: e.target.checked })}
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

        {/* Footer */}
        <div className="flex justify-between p-6 border-t">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
