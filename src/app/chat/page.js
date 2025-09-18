'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Calculator, Atom, Globe, Palette, Music, Code, Heart, Brain, Zap } from 'lucide-react';

export default function SubjectSelection() {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState('');

  const subjects = [
    {
      id: 'mathematics',
      name: 'Mathematics',
      icon: Calculator,
      description: 'Algebra, Geometry, Calculus, Statistics',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'science',
      name: 'Science',
      icon: Atom,
      description: 'Physics, Chemistry, Biology',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'social-science',
      name: 'Social Science',
      icon: Globe,
      description: 'History, Geography, Civics, Economics',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'english',
      name: 'English',
      icon: BookOpen,
      description: 'Literature, Grammar, Writing, Comprehension',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const handleSubjectSelect = (subjectId) => {
    setSelectedSubject(subjectId);
    // Navigate directly to chat without asking for name
    router.push(`/chat/enhanced?subject=${subjectId}`);
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">GeniWay</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSubjectSelect(subject.id)}
              className={`group p-8 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${subject.bgColor} ${subject.borderColor} hover:border-opacity-60`}
            >
              <div className="text-center">
                <div className={`w-20 h-20 bg-gradient-to-r ${subject.color} rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <subject.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {subject.name}
                </h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  {subject.description}
                </p>
              </div>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
