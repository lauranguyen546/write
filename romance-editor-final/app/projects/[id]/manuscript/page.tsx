'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ManuscriptViewer, {
  ViewerChunk,
  ViewerIssue,
} from '@/components/manuscript/ManuscriptViewer';

interface ManuscriptData {
  id: string;
  text: string;
  chunks: ViewerChunk[];
}

export default function ManuscriptPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [manuscript, setManuscript] = useState<ManuscriptData | null>(null);
  const [issues, setIssues] = useState<ViewerIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch(`/api/issues?projectId=${projectId}`);
      if (response.ok) {
        setIssues(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  }, [projectId]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`/api/manuscript?projectId=${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setManuscript(data.manuscript);
        }
        await fetchIssues();
      } catch (error) {
        console.error('Failed to fetch manuscript:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, fetchIssues]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading manuscript...</p>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Manuscript</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Manuscript Uploaded
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Upload your manuscript to read it here with inline issue highlights,
              chapter navigation, and one-click rewrites.
            </p>
            <Link
              href={`/projects/${projectId}/settings`}
              className="inline-block px-6 py-3 bg-romance-600 text-white rounded-lg hover:bg-romance-700 transition-colors font-medium"
            >
              Upload Manuscript
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ManuscriptViewer
      projectId={projectId}
      text={manuscript.text}
      chunks={manuscript.chunks}
      issues={issues}
      onIssuesChanged={fetchIssues}
    />
  );
}
