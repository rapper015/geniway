export default function FeaturesGrid() {
  const features = [
    {
      emoji: "🎤",
      title: "Voice-first & Hinglish",
      description: "Speak naturally in any language"
    },
    {
      emoji: "📷",
      title: "Photo questions",
      description: "Upload any question image"
    },
    {
      emoji: "📚",
      title: "Step-by-step",
      description: "Learn concepts, not just answers"
    },
    {
      emoji: "📱",
      title: "Low-data friendly",
      description: "Works on 2G/3G connections"
    },
    {
      emoji: "🌐",
      title: "EN/HI/Hinglish",
      description: "Multiple language support"
    },
    {
      emoji: "⚡",
      title: "Works on mid-range",
      description: "Optimized for all devices"
    }
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">Why students love GeniWay</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-4 rounded-2xl border border-gray-200 text-center">
              <div className="text-2xl mb-2">{feature.emoji}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
