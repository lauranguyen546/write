'use client';

import { useParams } from 'next/navigation';

export default function StoryBiblePage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Story Bible</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Story Bible Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              The Story Bible automatically extracts and tracks characters, relationships,
              timeline, settings, and more from your manuscript analysis.
            </p>
            <div className="inline-block bg-green-50 border border-green-200 rounded-lg p-4 text-left max-w-md">
              <p className="text-sm font-medium text-green-900 mb-2">✅ Already Tracked (Backend):</p>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Characters with traits and roles</li>
                <li>• Relationship connections</li>
                <li>• Timeline of major events</li>
                <li>• POV map by chapter</li>
                <li>• Settings and locations</li>
                <li>• Unresolved plot threads</li>
              </ul>
              <p className="text-xs text-green-700 mt-3">
                💡 This data is collected during analysis - we just need to visualize it!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
