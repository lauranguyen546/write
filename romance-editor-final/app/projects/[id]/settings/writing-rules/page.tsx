'use client';

import { useParams, useRouter } from 'next/navigation';
import RulesEditor from '@/components/rules/RulesEditor';

export default function WritingRulesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 text-sm"
          >
            ← Back to Settings
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Writing Rules</h1>
          <p className="text-gray-600 mt-2">
            Define your unique writing style and preferences. These rules will be respected during
            manuscript analysis, preventing false positives and preserving your authorial voice.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How Writing Rules Work</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Style:</strong> Formatting and structural preferences (fragments, punctuation)</li>
            <li>• <strong>Voice:</strong> Dialect, tense, and narrative choices</li>
            <li>• <strong>Grammar:</strong> Intentional exceptions to standard grammar</li>
            <li>• <strong>Forbidden:</strong> Clichés and patterns to actively avoid</li>
          </ul>
          <p className="text-sm text-blue-800 mt-3">
            💡 <strong>Tip:</strong> Higher priority rules are checked first. Toggle rules on/off
            to test different approaches without deleting them.
          </p>
        </div>

        <RulesEditor projectId={projectId} />
      </div>
    </div>
  );
}
