'use client';

import { useParams } from 'next/navigation';

export default function ManuscriptPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <div className="h-full p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Manuscript Viewer</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Manuscript Viewer Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              The integrated manuscript viewer will display your full manuscript with inline
              annotations, chapter navigation, and color-coded highlights for issues.
            </p>
            <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md">
              <p className="text-sm font-medium text-blue-900 mb-2">Planned Features:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Split-screen layout (manuscript + issues)</li>
                <li>• Color-coded highlights by severity</li>
                <li>• Click highlights to see issue details</li>
                <li>• Chapter/scene navigation sidebar</li>
                <li>• Reading mode toggle</li>
                <li>• Export with annotations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
