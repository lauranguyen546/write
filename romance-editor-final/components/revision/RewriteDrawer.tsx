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
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

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
      setEditedText(data.revision?.suggestedText || '');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate rewrite');
    } finally {
      setLoading(false);
    }
  };

  const wasEdited = revision && editedText !== revision.suggestedText;

  const handleAccept = async () => {
    if (!revision) return;

    try {
      const response = await fetch(`/api/revisions/${revision.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the edited text when the author customized the suggestion
        body: wasEdited ? JSON.stringify({ suggestedText: editedText }) : undefined,
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
                <h3 className="text-lg font-semibold">
                  Suggested Revision
                  {wasEdited && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium align-middle">
                      Edited
                    </span>
                  )}
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-3 py-1 text-sm rounded ${
                      isEditing
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ✏️ {isEditing ? 'Done Editing' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'side-by-side' && !isEditing
                        ? 'bg-romance-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={isEditing}
                  >
                    Side by Side
                  </button>
                  <button
                    onClick={() => setViewMode('inline')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'inline' && !isEditing
                        ? 'bg-romance-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    disabled={isEditing}
                  >
                    Inline
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div>
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Edit the AI suggestion to match your voice, then click "Done Editing"
                      to preview the diff.
                    </p>
                    {wasEdited && (
                      <button
                        onClick={() => setEditedText(revision.suggestedText)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Reset to AI version
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <DiffViewer
                  originalText={revision.originalText}
                  suggestedText={editedText || revision.suggestedText}
                  inline={viewMode === 'inline'}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {revision && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button onClick={handleReject} className="btn-secondary">
              Reject
            </button>
            <button onClick={handleAccept} className="btn-primary" disabled={isEditing}>
              {wasEdited ? 'Accept Edited Revision' : 'Accept Revision'}
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
