'use client';

import { MessageCircle, Brain, GraduationCap, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: MessageCircle,
      title: "Ask Your Doubt",
      description: "Type, speak, or upload a photo of your question in English, Hindi, or Hinglish. Our AI understands context and language nuances.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: 2,
      icon: Brain,
      title: "Get Instant Help",
      description: "Geni Ma'am analyzes your question and provides step-by-step solutions with detailed explanations and examples.",
      color: "from-purple-500 to-pink-500"
    },
    {
      number: 3,
      icon: GraduationCap,
      title: "Learn the Concept",
      description: "Understand the underlying concepts with detailed explanations, practice problems, and related examples for better retention.",
      color: "from-green-500 to-teal-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get help with your doubts in just three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                {/* Step Number & Icon */}
                <div className="relative mb-8">
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto shadow-xl`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100">
                    <span className="text-sm font-bold text-gray-700">{step.number}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="max-w-sm mx-auto">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-12 h-12 transform -translate-x-6">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Learning?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already solving their doubts with GeniWay
            </p>
            <button
              onClick={() => {
                window.location.href = '/chat';
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Get Started Now - It's Free!
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
