'use client';

import { testGTMEvent, gtmEvents } from '../lib/gtm';

export default function GTMTestButton() {
  const handleTestGTM = () => {
    console.log('Testing Google Analytics functionality...');
    testGTMEvent();
  };

  const handleTestButtonClick = () => {
    console.log('Testing button click event...');
    gtmEvents.buttonClicked('test_button', 'gtm_test_component');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-semibold mb-2">Analytics Test</h3>
      <div className="space-y-2">
        <button
          onClick={handleTestGTM}
          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test GA Event
        </button>
        <button
          onClick={handleTestButtonClick}
          className="block w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Button Click
        </button>
      </div>
    </div>
  );
}
