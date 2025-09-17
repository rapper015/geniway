'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Calculator, Atom, Globe, Palette, Music, Code, Heart, Brain, Zap } from 'lucide-react';

export default function SubjectSelection() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState('');
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const subjects = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: Calculator,
      description: 'Algebra, Geometry, Calculus, Statistics',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'physics',
      name: 'Physics',
      icon: Atom,
      description: 'Mechanics, Thermodynamics, Optics, Quantum',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'chemistry',
      name: 'Chemistry',
      icon: Zap,
      description: 'Organic, Inorganic, Physical Chemistry',
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'biology',
      name: 'Biology',
      icon: Heart,
      description: 'Cell Biology, Genetics, Ecology, Evolution',
      color: 'from-red-500 to-orange-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      id: 'english',
      name: 'English',
      icon: BookOpen,
      description: 'Literature, Grammar, Writing, Comprehension',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'social-science',
      name: 'Social Science',
      icon: Globe,
      description: 'History, Geography, Civics, Economics',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'computer-science',
      name: 'Computer Science',
      icon: Code,
      description: 'Programming, Algorithms, Data Structures',
      color: 'from-gray-500 to-slate-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'general',
      name: 'General',
      icon: Brain,
      description: 'Any subject or mixed questions',
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    }
  ];

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
    setShowNameInput(true);
  };

  const handleStartChat = () => {
    if (userName.trim()) {
      // Store user info in localStorage
      localStorage.setItem('selectedSubject', selectedSubject);
      localStorage.setItem('userName', userName.trim());
      
      // Navigate to chat interface
      router.push('/chat/interface');
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackClick}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">GeniWay</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showNameInput ? (
          <>
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Choose Your Subject
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Select the subject you need help with, and Geni Ma'am will provide personalized assistance
              </p>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjects.map((subject) => (
                <button
                  key={subject.id}
                  onClick={() => handleSubjectSelect(subject.id)}
                  className={`group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${subject.bgColor} ${subject.borderColor} hover:border-opacity-60`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 bg-gradient-to-r ${subject.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <subject.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {subject.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Start Option */}
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Not sure which subject?
                </h3>
                <p className="text-gray-600 mb-6">
                  No worries! You can start with "General" and ask any question. 
                  Geni Ma'am will help you regardless of the subject.
                </p>
                <button
                  onClick={() => handleSubjectSelect('general')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Start with General Questions
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Name Input Section */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Almost there! What's your name?
                </h2>
                <p className="text-gray-600 text-lg">
                  This helps Geni Ma'am personalize your learning experience
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
                <div className="mb-6">
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    id="userName"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowNameInput(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartChat}
                    disabled={!userName.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
                  >
                    Start Learning
                  </button>
                </div>
              </div>

              {/* Selected Subject Display */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  Selected: {subjects.find(s => s.id === selectedSubject)?.name}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
