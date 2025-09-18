export default function SocialProof() {
  const testimonials = [
    {
      text: "Amazing! Got my trigonometry doubt cleared in seconds. The step-by-step explanation was so easy to understand.",
      location: "Indore • Class 10"
    },
    {
      text: "Finally, a platform that understands Hindi! No more struggling with English-only explanations.",
      location: "Patna • Class 9"
    },
    {
      text: "As a parent, I love that my child is learning concepts instead of just getting answers. Very safe platform.",
      location: "Lucknow • Parent"
    }
  ];

  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">What students are saying</h2>
        <div className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl border border-gray-200">
              <p className="text-gray-600 text-sm mb-3">{testimonial.text}</p>
              <div className="text-xs text-gray-500">{testimonial.location}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
