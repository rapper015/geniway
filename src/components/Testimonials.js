'use client';

import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      text: "Amazing! Got my trigonometry doubt cleared in seconds. The step-by-step explanation was so easy to understand. Finally, a platform that actually teaches concepts!",
      author: "Priya Sharma",
      location: "Indore • Class 10",
      rating: 5,
      avatar: "PS"
    },
    {
      text: "Finally, a platform that understands Hindi! No more struggling with English-only explanations. My daughter loves using GeniWay for her math homework.",
      author: "Rajesh Kumar",
      location: "Patna • Parent",
      rating: 5,
      avatar: "RK"
    },
    {
      text: "As a teacher, I love that GeniWay focuses on teaching concepts rather than just giving answers. It's a safe platform that actually helps students learn.",
      author: "Dr. Meera Singh",
      location: "Lucknow • Teacher",
      rating: 5,
      avatar: "MS"
    },
    {
      text: "The voice feature is incredible! I can just speak my question in Hindi and get instant help. It's like having a personal tutor available 24/7.",
      author: "Arjun Patel",
      location: "Mumbai • Class 12",
      rating: 5,
      avatar: "AP"
    },
    {
      text: "Photo upload feature is a game-changer! I can just click a picture of my question and get detailed solutions. Saves so much time typing complex equations.",
      author: "Sneha Reddy",
      location: "Hyderabad • Class 11",
      rating: 5,
      avatar: "SR"
    },
    {
      text: "My son's grades have improved significantly since he started using GeniWay. The explanations are clear and he actually understands the concepts now.",
      author: "Sunita Gupta",
      location: "Delhi • Parent",
      rating: 5,
      avatar: "SG"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Students & Parents Are Saying
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real feedback from real users who are transforming their learning experience
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Quote className="w-6 h-6 text-white" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-gray-700 leading-relaxed mb-6">
                "{testimonial.text}"
              </p>

              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Join Thousands of Happy Students
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Start your learning journey today and experience the difference GeniWay can make
            </p>
            <button
              onClick={() => {
                window.location.href = '/chat';
              }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl font-semibold text-lg hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Learning Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
