'use client';

import { useState } from 'react';
import { Play, Mic, Camera, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const [showSampleSheet, setShowSampleSheet] = useState(false);

  const handleGetStarted = () => {
    // Redirect to subject selection page
    window.location.href = '/chat';
  };

  const features = [
    { icon: Mic, text: "Voice Questions", color: "from-purple-500 to-pink-500" },
    { icon: Camera, text: "Photo Upload", color: "from-green-500 to-teal-500" },
    { icon: MessageSquare, text: "Text Chat", color: "from-blue-500 to-cyan-500" },
    { icon: Sparkles, text: "AI Powered", color: "from-orange-500 to-red-500" }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23e0f2fe%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Doubt hai?{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Geni Ma'am
              </span>{' '}
              se poochho
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Step-by-step help in English, Hindi, or Hinglish. 
              <span className="font-semibold text-blue-600"> Free during beta.</span> 
              No sign-up required.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${feature.color} text-white rounded-full text-sm font-medium shadow-lg`}
              >
                <feature.icon className="w-4 h-4" />
                {feature.text}
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button
              onClick={handleGetStarted}
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-3">
                <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Start Solving My Doubt
              </div>
            </button>
            
            <button
              onClick={() => setShowSampleSheet(true)}
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-all duration-300 hover:bg-blue-50"
            >
              Try a Sample Question
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Questions Solved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 mb-2">95%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Available Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Bottom Sheet */}
      {showSampleSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-md p-6 transform transition-transform">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-center mb-6">Try a Sample Question</h3>
            
            <div className="space-y-4">
              <button className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Class 10 • Mathematics</div>
                <div className="text-sm text-gray-600 mt-1">Prove that tan θ + cot θ = sec θ cosec θ</div>
              </button>
              
              <button className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Class 12 • Physics</div>
                <div className="text-sm text-gray-600 mt-1">A ball is thrown vertically upward with speed 20 m/s...</div>
              </button>
              
              <button className="w-full p-4 text-left border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="font-medium text-gray-900">Class 9 • Chemistry</div>
                <div className="text-sm text-gray-600 mt-1">Balance the equation: C₂H₄ + O₂ → CO₂ + H₂O</div>
              </button>
            </div>
            
            <button
              onClick={() => setShowSampleSheet(false)}
              className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
