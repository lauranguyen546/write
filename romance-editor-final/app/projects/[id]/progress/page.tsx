'use client';

import { useParams } from 'next/navigation';

export default function ProgressPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Editing Progress</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Progress Dashboard Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              Visualize your editing progress with completion percentages, issue resolution
              velocity, and estimated time to completion.
            </p>
            <div className="inline-block bg-purple-50 border border-purple-200 rounded-lg p-4 text-left max-w-md">
              <p className="text-sm font-medium text-purple-900 mb-2">Planned Metrics:</p>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Overall completion % (resolved/total issues)</li>
                <li>• Issues by category (pie chart)</li>
                <li>• Editing velocity (issues per day)</li>
                <li>• Estimated time to completion</li>
                <li>• Progress over time (line chart)</li>
                <li>• Revision acceptance rate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
