'use client';

export default function ParentsBlock() {

  const handleWhatsAppClick = () => {
    const message = `Hi! I found this amazing AI tutor for solving doubts - Geni Ma'am! 🎓

She can help with:
✅ Math, Science, Social Science
✅ Step-by-step explanations  
✅ Works in English/Hindi/Hinglish
✅ Free during beta!

Try it here: ${window.location.origin}/chat

Perfect for Class 6-12 students! 📚`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const safetyFeatures = [
    "Focuses on teaching concepts, not giving direct answers",
    "Optional time limits and usage controls",
    "Complete privacy - no personal data collection",
    "Daily progress summaries available"
  ];

  return (
    <section className="py-12">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center text-gray-900 mb-8">For Parents: Safe & Controlled</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="space-y-4 mb-6">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-600 text-sm">{feature}</p>
              </div>
            ))}
          </div>
          <button 
            className="w-full py-4 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors min-h-[44px]" 
            data-testid="button-whatsapp-parent"
            onClick={handleWhatsAppClick}
          >
            📱 Send link to my child (WhatsApp)
          </button>
        </div>
      </div>
    </section>
  );
}
