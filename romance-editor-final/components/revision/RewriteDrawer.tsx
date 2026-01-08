'use client';

import { useState } from 'react';
import DiffViewer from './DiffViewer';

interface RewriteDrawerProps {
  issue: {
    id: string;
    title: string;
    description: string;
    evidence?: string;
    suggestion?: string;
  };
  onClose: () => void;
  onAccept?: (revisionId: string) => void;
  onReject?: (revisionId: string) => void;
}

export default function RewriteDrawer({ issue, onClose, onAccept, onReject }: RewriteDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState<any>(null);
  const [additionalGuidance, setAdditionalGuidance] = useState('');
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('side-by-side');

  const generateRewrite = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/revisions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: issue.id,
          additionalGuidance: additionalGuidance || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate rewrite');
      }

      const data = await response.json();
      setRevision(data.revision);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate rewrite');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!revision) return;

    try {
      const response = await fetch(`/api/revisions/${revision.id}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        onAccept?.(revision.id);
        onClose();
      }
    } catch (err) {
      setError('Failed to accept revision');
    }
  };

  const handleReject = async () => {
    if (!revision) return;

    try {
      const response = await fetch(`/api/revisions/${revision.id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        onReject?.(revision.id);
        onClose();
      }
    } catch (err) {
      setError('Failed to reject revision');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Generate Rewrite</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Issue Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.title}</h3>
            <p className="text-gray-700 mb-3">{issue.description}</p>
            
            {issue.evidence && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Original Text:</p>
                <p className="text-sm text-gray-700 font-mono">{issue.evidence}</p>
              </div>
            )}
            
            {issue.suggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs font-medium text-blue-700 mb-1">Editorial Guidance:</p>
                <p className="text-sm text-blue-900">{issue.suggestion}</p>
              </div>
            )}
          </div>

          {/* Additional Guidance */}
          {!revision && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Instructions (optional)
              </label>
              <textarea
                value={additionalGuidance}
                onChange={(e) => setAdditionalGuidance(e.target.value)}
                placeholder="E.g., 'Keep it shorter' or 'Make it more comedic'"
                className="input-field h-24"
                disabled={loading}
              />
            </div>
          )}

          {/* Generate Button */}
          {!revision && (
            <div>
              <button
                onClick={generateRewrite}
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate AI Rewrite'
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Diff View */}
          {revision && (
            <div>
              {/* View Mode Toggle */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Suggested Revision</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'side-by-side'
                        ? 'bg-romance-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Side by Side
                  </button>
                  <button
                    onClick={() => setViewMode('inline')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'inline'
                        ? 'bg-romance-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Inline
                  </button>
                </div>
              </div>

              <DiffViewer
                originalText={revision.originalText}
                suggestedText={revision.suggestedText}
                inline={viewMode === 'inline'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {revision && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={handleReject} className="btn-secondary">
              Reject
            </button>
            <button onClick={handleAccept} className="btn-primary">
              Accept Revision
            </button>
            <button
              onClick={() => setRevision(null)}
              className="px-4 py-2 text-romance-600 hover:text-romance-700 font-medium"
            >
              Generate New Version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
