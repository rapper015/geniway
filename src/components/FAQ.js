'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQ() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "Is GeniWay really free?",
      answer: "Yes! GeniWay is completely free during our beta period. No hidden charges, no subscription fees, and no premium features locked behind paywalls. We believe quality education should be accessible to everyone."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account needed to get started! You can begin asking your doubts immediately without any sign-up process. However, creating an account allows you to save your progress, track your learning journey, and access additional features."
    },
    {
      question: "What subjects and classes are supported?",
      answer: "We support all major subjects for Classes 1-12 including Mathematics, Physics, Chemistry, Biology, Social Science, English, and Hindi across CBSE, ICSE, State boards, and other educational systems."
    },
    {
      question: "Can I ask questions in Hindi or Hinglish?",
      answer: "Absolutely! You can ask questions in English, Hindi, or Hinglish. Our AI understands all three languages perfectly and can provide answers in your preferred language for better comprehension."
    },
    {
      question: "How does the photo question solving work?",
      answer: "Simply take a clear photo of your question and upload it. Our advanced AI can read handwriting, printed text, and even mathematical equations. It will analyze the question and provide step-by-step solutions instantly."
    },
    {
      question: "Is it safe for my child to use?",
      answer: "Yes, GeniWay is completely safe for children. We focus on teaching concepts rather than giving direct answers, which promotes learning. Parents can set time limits, monitor progress, and get daily reports about their child's learning activity."
    },
    {
      question: "How accurate are the answers?",
      answer: "Our AI has been trained on vast educational content and maintains a 95%+ accuracy rate. All answers are verified by educational experts, and we continuously improve our system based on user feedback."
    },
    {
      question: "Can teachers use GeniWay?",
      answer: "Yes! Teachers can use GeniWay to create lesson plans, generate practice questions, and get help with complex topics. We also offer special features for educators to track student progress and identify learning gaps."
    },
    {
      question: "Does it work on slow internet connections?",
      answer: "Yes, GeniWay is optimized for all types of internet connections, including 2G and 3G. We use efficient algorithms and data compression to ensure smooth performance even on slower networks."
    },
    {
      question: "How do I get help if I'm stuck?",
      answer: "If you encounter any issues, you can reach out to our support team through the in-app chat feature, email, or WhatsApp. We typically respond within a few hours and are available 24/7 to help you."
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about GeniWay
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <button
                className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 text-lg pr-4">
                  {faq.question}
                </span>
                {openFAQ === index ? (
                  <ChevronUp className="w-6 h-6 text-blue-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you 24/7
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  const event = new CustomEvent('showAuthModal');
                  window.dispatchEvent(event);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-500 transition-all duration-300"
              >
                Get Started Now
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
