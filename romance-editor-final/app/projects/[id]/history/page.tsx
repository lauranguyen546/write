'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface VersionSummary {
  id: string;
  versionNumber: number;
  description: string | null;
  wordCount: number;
  createdBy: string;
  createdAt: string;
}

export default function HistoryPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState<VersionSummary | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/versions?projectId=${projectId}`);
      if (response.ok) {
        setVersions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, description: description || undefined }),
      });
      if (response.ok) {
        const result = await response.json();
        showMessage(
          result.created
            ? `Saved version ${result.version.versionNumber}`
            : 'No changes since the last version — nothing to save'
        );
        setDescription('');
        await fetchVersions();
      } else {
        const data = await response.json();
        showMessage(data.error || 'Failed to save version');
      }
    } catch {
      showMessage('Failed to save version');
    } finally {
      setSaving(false);
    }
  };

  const fetchVersionContent = async (id: string): Promise<string | null> => {
    const response = await fetch(`/api/versions?id=${id}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.content;
  };

  const handlePreview = async (version: VersionSummary) => {
    const content = await fetchVersionContent(version.id);
    if (content != null) {
      setPreviewText(content);
      setPreviewVersion(version);
    }
  };

  const handleDownload = async (version: VersionSummary) => {
    const content = await fetchVersionContent(version.id);
    if (content == null) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manuscript-v${version.versionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async (version: VersionSummary) => {
    if (
      !confirm(
        `Restore version ${version.versionNumber}?\n\nThis creates a fresh manuscript from that snapshot. Existing analysis results stay attached to the old manuscript — run a new analysis after restoring.`
      )
    ) {
      return;
    }
    setRestoring(version.id);
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, restoreId: version.id }),
      });
      if (response.ok) {
        showMessage(`Restored version ${version.versionNumber}`);
        await fetchVersions();
      } else {
        showMessage('Failed to restore version');
      }
    } catch {
      showMessage('Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading version history...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Version History</h1>
          <p className="text-gray-600 mt-1">
            Snapshots of your manuscript with accepted rewrites applied. A version is
            saved automatically every time you accept a rewrite.
          </p>
        </div>

        {/* Manual save */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Describe this version (e.g., "Before beta readers")'
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-romance-500"
            />
            <button
              onClick={handleSaveVersion}
              disabled={saving}
              className="px-5 py-2 bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Version'}
            </button>
          </div>
          {message && <p className="text-sm text-gray-700 mt-3">{message}</p>}
        </div>

        {/* Version list */}
        {versions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Versions Yet
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Versions are saved automatically when you accept rewrites on the{' '}
              <Link
                href={`/projects/${projectId}/analysis`}
                className="text-romance-600 hover:text-romance-800"
              >
                Analysis page
              </Link>
              , or save one manually above before making big changes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, idx) => {
              const previous = versions[idx + 1];
              const delta = previous ? version.wordCount - previous.wordCount : null;
              return (
                <div
                  key={version.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-romance-50 text-romance-700 flex items-center justify-center font-bold flex-shrink-0">
                      v{version.versionNumber}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {version.description || 'Manual snapshot'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleString()} ·{' '}
                        {version.wordCount.toLocaleString()} words
                        {delta != null && delta !== 0 && (
                          <span className={delta > 0 ? 'text-green-700' : 'text-red-700'}>
                            {' '}
                            ({delta > 0 ? '+' : ''}
                            {delta.toLocaleString()})
                          </span>
                        )}
                        {version.createdBy === 'auto-accept' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            auto
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(version)}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleDownload(version)}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleRestore(version)}
                      disabled={restoring === version.id}
                      className="px-3 py-1.5 text-sm text-romance-700 bg-romance-50 rounded hover:bg-romance-100 transition-colors disabled:opacity-50"
                    >
                      {restoring === version.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewText != null && previewVersion && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewText(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                Version {previewVersion.versionNumber}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {previewVersion.wordCount.toLocaleString()} words
                </span>
              </h2>
              <button
                onClick={() => setPreviewText(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="whitespace-pre-wrap font-serif text-[16px] leading-relaxed text-gray-800">
                {previewText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
