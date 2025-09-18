'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      question: "Is GeniWay really free?",
      answer: "Yes! GeniWay is completely free during our beta period. No hidden charges, no subscription fees."
    },
    {
      question: "Do I need to create an account?",
      answer: "No account needed! Just start asking your doubts immediately. No sign-up, no OTP verification required."
    },
    {
      question: "What subjects and classes are supported?",
      answer: "We support all major subjects for Classes 6-12 including Maths, Physics, Chemistry, Biology and Social Science across CBSE, ICSE and State boards."
    },
    {
      question: "Can I ask questions in Hindi?",
      answer: "Absolutely! You can ask questions in English, Hindi, or Hinglish. Our AI understands all three languages perfectly."
    },
    {
      question: "How does photo question solving work?",
      answer: "Simply take a photo of your question and upload it. Our AI will read the question and provide step-by-step solutions instantly."
    },
    {
      question: "Is it safe for my child to use?",
      answer: "Yes, GeniWay is completely safe. We focus on teaching concepts rather than giving direct answers. Parents can set time limits and get daily progress reports."
    }
  ];

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-2xl">
              <button 
                className="w-full p-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                data-testid={`faq-toggle-${index}`}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <div className="flex justify-between items-center">
                  <span>{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transform transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
              {openFAQ === index && (
                <div className="p-4 pt-0 text-gray-600 text-sm" data-testid={`faq-content-${index}`}>
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}