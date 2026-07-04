'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Share {
  id: string;
  token: string;
  active: boolean;
  viewCount: number;
  _count?: { comments: number };
}

interface BetaComment {
  id: string;
  readerName: string;
  text: string;
  excerpt: string | null;
  type: string;
  resolved: boolean;
  createdAt: string;
}

const TYPE_BADGES: { [key: string]: { label: string; color: string } } = {
  praise: { label: '💖 Loved it', color: 'bg-pink-100 text-pink-800' },
  confusion: { label: '❓ Confused', color: 'bg-yellow-100 text-yellow-800' },
  suggestion: { label: '💡 Suggestion', color: 'bg-blue-100 text-blue-800' },
  typo: { label: '✏️ Typo', color: 'bg-gray-100 text-gray-700' },
  comment: { label: '💬 Comment', color: 'bg-purple-100 text-purple-800' },
};

export default function FeedbackPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [share, setShare] = useState<Share | null>(null);
  const [comments, setComments] = useState<BetaComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [shareRes, commentsRes] = await Promise.all([
        fetch(`/api/share?projectId=${projectId}`),
        fetch(`/api/feedback?projectId=${projectId}`),
      ]);
      if (shareRes.ok) {
        const data = await shareRes.json();
        setShare(data.share);
      }
      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch feedback data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const shareUrl = share
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${share.token}`
    : '';

  const handleCreateShare = async () => {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    if (response.ok) {
      const data = await response.json();
      setShare(data.share);
    }
  };

  const handleToggleShare = async () => {
    if (!share) return;
    const response = await fetch('/api/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: share.id, active: !share.active }),
    });
    if (response.ok) {
      const data = await response.json();
      setShare({ ...share, active: data.share.active });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolve = async (comment: BetaComment) => {
    const response = await fetch('/api/feedback', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: comment.id, resolved: !comment.resolved }),
    });
    if (response.ok) {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, resolved: !c.resolved } : c))
      );
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const response = await fetch(`/api/feedback?id=${commentId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading feedback...</p>
      </div>
    );
  }

  const openComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);

  const renderComment = (comment: BetaComment) => {
    const badge = TYPE_BADGES[comment.type] || TYPE_BADGES.comment;
    return (
      <div
        key={comment.id}
        className={`bg-white rounded-lg border p-5 ${
          comment.resolved ? 'border-gray-200 opacity-60' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{comment.readerName}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResolve(comment)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                comment.resolved
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {comment.resolved ? 'Reopen' : '✓ Resolve'}
            </button>
            <button
              onClick={() => handleDelete(comment.id)}
              className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        {comment.excerpt && (
          <blockquote className="text-sm text-gray-600 italic border-l-2 border-romance-300 pl-3 mb-2">
            "{comment.excerpt}"
          </blockquote>
        )}
        <p className="text-sm text-gray-800">{comment.text}</p>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beta Reader Feedback</h1>
          <p className="text-gray-600 mt-1">
            Share your manuscript with beta readers and collect their comments here
          </p>
        </div>

        {/* Share link management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Link</h2>
          {!share ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Create a private view-only link. Anyone with the link can read the
                manuscript (with your accepted rewrites applied) and leave comments —
                they can't edit anything.
              </p>
              <button
                onClick={handleCreateShare}
                className="px-5 py-2 bg-romance-600 text-white rounded-lg hover:bg-romance-700 transition-colors font-medium"
              >
                🔗 Create Share Link
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className={`flex-1 px-4 py-2 border rounded-md text-sm bg-gray-50 ${
                    share.active ? 'border-gray-300 text-gray-800' : 'border-gray-200 text-gray-400 line-through'
                  }`}
                />
                <button
                  onClick={handleCopy}
                  disabled={!share.active}
                  className="px-4 py-2 bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors text-sm disabled:opacity-50"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {share.viewCount} view{share.viewCount === 1 ? '' : 's'} ·{' '}
                  {comments.length} comment{comments.length === 1 ? '' : 's'}
                </span>
                <button
                  onClick={handleToggleShare}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    share.active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {share.active ? 'Disable link' : 'Re-enable link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        {comments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Feedback Yet
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              {share
                ? 'Send your share link to beta readers — their comments will appear here as they read.'
                : 'Create a share link above and send it to your beta readers.'}
            </p>
          </div>
        ) : (
          <>
            {openComments.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Open ({openComments.length})
                </h2>
                {openComments.map(renderComment)}
              </section>
            )}
            {resolvedComments.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-500">
                  Resolved ({resolvedComments.length})
                </h2>
                {resolvedComments.map(renderComment)}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
