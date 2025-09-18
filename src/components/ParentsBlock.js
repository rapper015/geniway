'use client';

import { useState } from "react";

export default function ParentsBlock() {
  const [isLoading, setIsLoading] = useState(false);

  const handleWhatsAppClick = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('WhatsApp link generated');
      alert('WhatsApp link generated! (Demo)');
    } catch (error) {
      console.error('Failed to generate WhatsApp link:', error);
      alert('Failed to generate WhatsApp link');
    } finally {
      setIsLoading(false);
    }
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
            className="w-full py-4 bg-green-500 text-white font-semibold rounded-2xl hover:bg-green-600 transition-colors min-h-[44px] disabled:opacity-50" 
            data-testid="button-whatsapp-parent"
            onClick={handleWhatsAppClick}
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "📱 Send link to my child (WhatsApp)"}
          </button>
        </div>
      </div>
    </section>
  );
}
