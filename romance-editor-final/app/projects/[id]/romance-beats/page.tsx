'use client';

import { useParams } from 'next/navigation';

export default function RomanceBeatsPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Romance Beat Tracker</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💕</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Romance Beat Tracker Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              Track your manuscript's adherence to the Romancing the Beat 14-beat structure
              with visual progress indicators and beat detection.
            </p>
            <div className="inline-block bg-pink-50 border border-pink-200 rounded-lg p-4 text-left max-w-md">
              <p className="text-sm font-medium text-pink-900 mb-2">Romancing the Beat Structure:</p>
              <ul className="text-sm text-pink-800 space-y-1">
                <li>✓ Meet-Cute</li>
                <li>✓ No Way!</li>
                <li>✓ Hook</li>
                <li>✓ First Kiss</li>
                <li>✓ Midpoint Commitment</li>
                <li>✓ The Lurch</li>
                <li>✓ Black Moment</li>
                <li>✓ Grand Gesture / HEA</li>
                <li>...and 6 more beats</li>
              </ul>
              <p className="text-xs text-pink-700 mt-3">
                💡 Beat tracking is already implemented - visualization coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
