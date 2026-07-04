'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const COMMENT_TYPES = [
  { value: 'praise', label: '💖 Loved it', color: 'bg-pink-100 text-pink-800' },
  { value: 'confusion', label: '❓ Confused', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'suggestion', label: '💡 Suggestion', color: 'bg-blue-100 text-blue-800' },
  { value: 'typo', label: '✏️ Typo', color: 'bg-gray-100 text-gray-800' },
  { value: 'comment', label: '💬 Comment', color: 'bg-purple-100 text-purple-800' },
];

export default function SharedManuscriptPage() {
  const params = useParams();
  const token = params.token as string;

  const [title, setTitle] = useState('');
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [readerName, setReaderName] = useState('');
  const [selection, setSelection] = useState<{
    text: string;
    position: number | null;
    x: number;
    y: number;
  } | null>(null);
  const [commentDialog, setCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [submitted, setSubmitted] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('beta-reader-name');
    if (stored) setReaderName(stored);

    const load = async () => {
      try {
        const response = await fetch(`/api/share/${token}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title);
          setText(data.text);
        } else {
          const data = await response.json();
          setError(data.error || 'This link is no longer available');
        }
      } catch {
        setError('Failed to load the manuscript');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }
    const selected = sel.toString().trim();
    if (selected.length < 3 || !textRef.current?.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const position = text ? text.indexOf(selected) : null;
    setSelection({
      text: selected,
      position: position !== null && position >= 0 ? position : null,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const submitComment = async () => {
    if (!readerName.trim() || !commentText.trim()) return;
    localStorage.setItem('beta-reader-name', readerName.trim());

    try {
      const response = await fetch(`/api/share/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readerName: readerName.trim(),
          text: commentText.trim(),
          excerpt: selection?.text || null,
          position: selection?.position ?? null,
          type: commentType,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setSentCount((c) => c + 1);
        setTimeout(() => {
          setCommentDialog(false);
          setSubmitted(false);
          setCommentText('');
          setSelection(null);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Opening manuscript...</p>
        </div>
      </div>
    );
  }

  if (error || text == null) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-10 text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link Unavailable
          </h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
            <p className="text-xs text-gray-500">
              Beta reader copy — select any passage to leave a comment
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {sentCount > 0 && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                {sentCount} comment{sentCount > 1 ? 's' : ''} sent
              </span>
            )}
            <button
              onClick={() => {
                setSelection(null);
                setCommentDialog(true);
              }}
              className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
            >
              💬 General comment
            </button>
          </div>
        </div>
      </div>

      {/* Manuscript */}
      <div
        ref={textRef}
        onMouseUp={handleMouseUp}
        className="max-w-3xl mx-auto px-6 py-10"
      >
        <div className="bg-white rounded-lg shadow-sm px-10 py-12 whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-gray-800">
          {text}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6 pb-10">
          Shared privately with you for feedback. Please don't redistribute.
        </p>
      </div>

      {/* Floating comment button on selection */}
      {selection && !commentDialog && (
        <button
          className="fixed z-40 -translate-x-1/2 -translate-y-full px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
          style={{ left: selection.x, top: selection.y - 6 }}
          onClick={() => setCommentDialog(true)}
        >
          💬 Comment on this
        </button>
      )}

      {/* Comment dialog */}
      {commentDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setCommentDialog(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Leave Feedback
            </h3>
            {submitted ? (
              <p className="text-green-700 bg-green-50 rounded p-3 text-sm">
                ✓ Sent to the author — thank you!
              </p>
            ) : (
              <div className="space-y-4">
                {selection && (
                  <blockquote className="text-sm text-gray-600 italic border-l-2 border-rose-300 pl-3 max-h-20 overflow-y-auto">
                    {selection.text}
                  </blockquote>
                )}
                <div className="flex flex-wrap gap-2">
                  {COMMENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setCommentType(t.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        commentType === t.value
                          ? `${t.color} ring-2 ring-offset-1 ring-rose-400`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={readerName}
                  onChange={(e) => setReaderName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What did you think?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setCommentDialog(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitComment}
                    disabled={!readerName.trim() || !commentText.trim()}
                    className="px-4 py-2 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    Send Feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
