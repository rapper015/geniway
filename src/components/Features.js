'use client';

import { Mic, Camera, BookOpen, Globe, Zap, Shield, Users, Star } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Mic,
      title: "Voice-First & Hinglish",
      description: "Speak naturally in any language - English, Hindi, or Hinglish. Our AI understands your accent and context perfectly.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Camera,
      title: "Photo Questions",
      description: "Simply take a photo of your question and upload it. Our AI reads handwriting and provides instant solutions.",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: BookOpen,
      title: "Step-by-Step Learning",
      description: "Learn concepts, not just answers. Get detailed explanations with examples to understand the underlying principles.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Ask questions in English, Hindi, or Hinglish. Get answers in your preferred language for better understanding.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses within seconds. Optimized for all devices, works smoothly even on slower connections.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      description: "Focuses on teaching concepts rather than giving direct answers. Parents can monitor progress and set limits.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const stats = [
    { icon: Users, value: "50K+", label: "Students Helped" },
    { icon: Star, value: "4.9/5", label: "User Rating" },
    { icon: BookOpen, value: "100+", label: "Subjects Covered" },
    { icon: Globe, value: "3", label: "Languages" }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Students Love{' '}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              GeniWay
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of learning with our AI-powered doubt-solving platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Trusted by Students Across India
            </h3>
            <p className="text-gray-600 text-lg">
              Join thousands of students who are already learning smarter with GeniWay
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
