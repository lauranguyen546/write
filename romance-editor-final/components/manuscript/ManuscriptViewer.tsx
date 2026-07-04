'use client';

import { useMemo, useState, useEffect, useRef, Fragment } from 'react';
import RewriteDrawer from '@/components/revision/RewriteDrawer';
import { locateEvidence } from '@/lib/analysis/evidence-locator';

export interface ViewerChunk {
  id: string;
  index: number;
  chapter?: string | null;
  scene?: string | null;
  startChar: number;
  endChar: number;
}

export interface ViewerIssue {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  evidence?: string | null;
  suggestion?: string | null;
  status: string;
  priority: number;
  chunkId?: string | null;
  startChar?: number | null;
  endChar?: number | null;
}

interface ManuscriptViewerProps {
  projectId: string;
  text: string;
  chunks: ViewerChunk[];
  issues: ViewerIssue[];
  onIssuesChanged: () => void;
  focusIssueId?: string | null;
}

interface Highlight {
  start: number;
  end: number;
  issue: ViewerIssue;
}

interface ChapterSection {
  title: string;
  start: number;
  end: number;
}

const SEVERITY_RANK: { [key: string]: number } = {
  critical: 0,
  major: 1,
  minor: 2,
  suggestion: 3,
};

const HIGHLIGHT_CLASSES: { [key: string]: string } = {
  critical: 'bg-red-200 hover:bg-red-300 border-b-2 border-red-500',
  major: 'bg-orange-200 hover:bg-orange-300 border-b-2 border-orange-500',
  minor: 'bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-500',
  suggestion: 'bg-blue-100 hover:bg-blue-200 border-b-2 border-blue-400',
};

const BADGE_CLASSES: { [key: string]: string } = {
  critical: 'bg-red-100 text-red-800',
  major: 'bg-orange-100 text-orange-800',
  minor: 'bg-yellow-100 text-yellow-800',
  suggestion: 'bg-blue-100 text-blue-800',
};

// Resolve each issue to an absolute character range in the manuscript.
// Prefers stored chunk-relative offsets; falls back to locating the
// quoted evidence inside the issue's chunk.
function computeHighlights(
  text: string,
  chunks: ViewerChunk[],
  issues: ViewerIssue[]
): Highlight[] {
  const chunkById = new Map(chunks.map((c) => [c.id, c]));
  const ranges: Highlight[] = [];

  for (const issue of issues) {
    if (issue.status === 'dismissed') continue;
    const chunk = issue.chunkId ? chunkById.get(issue.chunkId) : undefined;
    if (!chunk) continue;

    let start: number | null = null;
    let end: number | null = null;

    if (issue.startChar != null && issue.endChar != null && issue.endChar > issue.startChar) {
      start = chunk.startChar + issue.startChar;
      end = chunk.startChar + issue.endChar;
    } else if (issue.evidence) {
      // Fuzzy-locate the quote inside this chunk's slice of the text
      // (handles curly quotes, dashes, and whitespace differences)
      const chunkSlice = text.slice(chunk.startChar, chunk.endChar);
      const anchor = locateEvidence(chunkSlice, issue.evidence);
      if (anchor) {
        start = chunk.startChar + anchor.start;
        end = chunk.startChar + anchor.end;
      }
    }

    if (start == null || end == null) continue;
    start = Math.max(0, Math.min(start, text.length));
    end = Math.max(start, Math.min(end, text.length));
    if (end > start) ranges.push({ start, end, issue });
  }

  // Sort by position, then severity so the more severe issue wins overlaps
  ranges.sort(
    (a, b) =>
      a.start - b.start ||
      SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity]
  );

  // Drop overlapping ranges (first/most-severe wins)
  const result: Highlight[] = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      result.push(r);
      lastEnd = r.end;
    }
  }
  return result;
}

// Group consecutive chunks into chapter sections for navigation
function computeChapters(text: string, chunks: ViewerChunk[]): ChapterSection[] {
  if (chunks.length === 0) {
    return [{ title: 'Manuscript', start: 0, end: text.length }];
  }

  const sections: ChapterSection[] = [];
  for (const chunk of chunks) {
    const title = chunk.chapter || 'Opening';
    const prev = sections[sections.length - 1];
    if (prev && prev.title === title) {
      prev.end = chunk.endChar;
    } else {
      sections.push({ title, start: chunk.startChar, end: chunk.endChar });
    }
  }
  // Extend last section to cover any trailing text
  sections[sections.length - 1].end = text.length;
  sections[0].start = 0;
  return sections;
}

export default function ManuscriptViewer({
  projectId,
  text,
  chunks,
  issues,
  onIssuesChanged,
  focusIssueId,
}: ManuscriptViewerProps) {
  const [readingMode, setReadingMode] = useState(false);
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [rewriteIssue, setRewriteIssue] = useState<ViewerIssue | null>(null);
  const sidebarRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // "Add to Notes" from a text selection
  const [selectionAction, setSelectionAction] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [noteDialog, setNoteDialog] = useState<string | null>(null); // holds selected text
  const [noteType, setNoteType] = useState('custom');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const textPaneRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionAction(null);
      return;
    }
    const selected = sel.toString().trim();
    if (selected.length < 3 || !textPaneRef.current?.contains(sel.anchorNode)) {
      setSelectionAction(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelectionAction({
      text: selected,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const saveNote = async () => {
    if (!noteDialog) return;
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          type: noteType,
          title: noteTitle || noteDialog.slice(0, 60),
          content: `> ${noteDialog}`,
          tags: ['from-manuscript'],
        }),
      });
      if (response.ok) {
        setNoteSaved(true);
        setTimeout(() => {
          setNoteDialog(null);
          setNoteSaved(false);
          setNoteTitle('');
        }, 900);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const highlights = useMemo(
    () => computeHighlights(text, chunks, issues),
    [text, chunks, issues]
  );
  const chapters = useMemo(() => computeChapters(text, chunks), [text, chunks]);

  const anchoredIds = useMemo(
    () => new Set(highlights.map((h) => h.issue.id)),
    [highlights]
  );
  const unanchoredIssues = useMemo(
    () => issues.filter((i) => i.status !== 'dismissed' && !anchoredIds.has(i.id)),
    [issues, anchoredIds]
  );

  // Scroll the sidebar card into view when a highlight is clicked
  useEffect(() => {
    if (activeIssueId) {
      const el = sidebarRefs.current.get(activeIssueId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIssueId]);

  // Deep link: focus a specific issue on load (e.g. "View in manuscript"
  // from the Analysis page)
  useEffect(() => {
    if (!focusIssueId) return;
    setActiveIssueId(focusIssueId);
    // Wait a tick for the text to render before scrolling
    const timer = setTimeout(() => {
      document
        .getElementById(`hl-${focusIssueId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIssueId, highlights.length]);

  const jumpToHighlight = (issueId: string) => {
    setActiveIssueId(issueId);
    document
      .getElementById(`hl-${issueId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const jumpToChapter = (idx: number) => {
    document
      .getElementById(`chapter-${idx}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Render one chapter's text as plain + highlighted segments
  const renderSection = (section: ChapterSection) => {
    const sectionHighlights = highlights.filter(
      (h) => h.start >= section.start && h.start < section.end
    );

    const segments: JSX.Element[] = [];
    let cursor = section.start;

    for (const h of sectionHighlights) {
      if (h.start > cursor) {
        segments.push(
          <Fragment key={`t-${cursor}`}>{text.slice(cursor, h.start)}</Fragment>
        );
      }
      const clampedEnd = Math.min(h.end, section.end);
      if (readingMode) {
        segments.push(
          <Fragment key={`p-${h.start}`}>{text.slice(h.start, clampedEnd)}</Fragment>
        );
      } else {
        segments.push(
          <mark
            key={`h-${h.start}`}
            id={`hl-${h.issue.id}`}
            onClick={() => setActiveIssueId(h.issue.id)}
            className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
              HIGHLIGHT_CLASSES[h.issue.severity] || HIGHLIGHT_CLASSES.suggestion
            } ${activeIssueId === h.issue.id ? 'ring-2 ring-romance-500' : ''}`}
            title={h.issue.title}
          >
            {text.slice(h.start, clampedEnd)}
          </mark>
        );
      }
      cursor = clampedEnd;
    }

    if (cursor < section.end) {
      segments.push(
        <Fragment key={`t-${cursor}`}>{text.slice(cursor, section.end)}</Fragment>
      );
    }

    return segments;
  };

  const activeIssues = issues.filter((i) => i.status !== 'dismissed');

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Chapter Navigator */}
      <div className="w-52 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto hidden lg:block">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Chapters</h3>
        </div>
        <nav className="p-2">
          {chapters.map((chapter, idx) => {
            const count = highlights.filter(
              (h) => h.start >= chapter.start && h.start < chapter.end
            ).length;
            return (
              <button
                key={idx}
                onClick={() => jumpToChapter(idx)}
                className="w-full text-left px-3 py-2 rounded text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{chapter.title}</span>
                {count > 0 && !readingMode && (
                  <span className="flex-shrink-0 px-1.5 py-0.5 bg-romance-100 text-romance-700 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Manuscript Text */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {readingMode
              ? 'Reading mode — highlights hidden'
              : `${highlights.length} of ${activeIssues.length} issues anchored in text`}
          </p>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={readingMode}
              onChange={(e) => setReadingMode(e.target.checked)}
              className="rounded border-gray-300 text-romance-600 focus:ring-romance-500"
            />
            Reading mode
          </label>
        </div>
        <div
          ref={textPaneRef}
          onMouseUp={handleMouseUp}
          className="max-w-3xl mx-auto px-8 py-10"
        >
          {chapters.map((chapter, idx) => (
            <section key={idx} id={`chapter-${idx}`} className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {chapter.title}
              </h2>
              <div className="whitespace-pre-wrap font-serif text-[17px] leading-relaxed text-gray-800">
                {renderSection(chapter)}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Floating "Add to Notes" button on selection */}
      {selectionAction && !noteDialog && (
        <button
          className="fixed z-40 -translate-x-1/2 -translate-y-full mb-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
          style={{ left: selectionAction.x, top: selectionAction.y - 6 }}
          onClick={() => {
            setNoteDialog(selectionAction.text);
            setSelectionAction(null);
          }}
        >
          📝 Add to Notes
        </button>
      )}

      {/* Quick note dialog */}
      {noteDialog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setNoteDialog(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add to Notes</h3>
            {noteSaved ? (
              <p className="text-green-700 bg-green-50 rounded p-3 text-sm">
                ✓ Note saved
              </p>
            ) : (
              <div className="space-y-4">
                <blockquote className="text-sm text-gray-600 italic border-l-2 border-romance-300 pl-3 max-h-24 overflow-y-auto">
                  {noteDialog}
                </blockquote>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-romance-500"
                    >
                      <option value="character">👤 Character</option>
                      <option value="setting">🌍 Setting</option>
                      <option value="plot">📖 Plot</option>
                      <option value="theme">💭 Theme</option>
                      <option value="custom">📝 Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Auto from excerpt"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-romance-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setNoteDialog(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 text-sm bg-romance-600 text-white rounded-md hover:bg-romance-700 transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Annotations Sidebar */}
      {!readingMode && (
        <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h3 className="text-sm font-semibold text-gray-900">
              Annotations ({activeIssues.length})
            </h3>
          </div>
          <div className="p-3 space-y-3">
            {activeIssues.length === 0 && (
              <p className="text-sm text-gray-500 p-4 text-center">
                No open issues. Run an analysis or check the Analysis page.
              </p>
            )}
            {highlights.map(({ issue }) => (
              <div
                key={issue.id}
                ref={(el) => {
                  if (el) sidebarRefs.current.set(issue.id, el);
                }}
                onClick={() => jumpToHighlight(issue.id)}
                className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                  activeIssueId === issue.id
                    ? 'border-romance-400 ring-2 ring-romance-200 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      BADGE_CLASSES[issue.severity] || BADGE_CLASSES.suggestion
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {issue.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {issue.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-3">
                  {issue.description}
                </p>
                {issue.suggestion && (
                  <p className="text-xs text-blue-800 bg-blue-50 rounded p-2 mb-2 line-clamp-2">
                    💡 {issue.suggestion}
                  </p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRewriteIssue(issue);
                  }}
                  className="text-xs font-medium text-romance-600 hover:text-romance-800 transition-colors"
                >
                  Generate Rewrite →
                </button>
              </div>
            ))}

            {unanchoredIssues.length > 0 && (
              <div className="pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-1">
                  Not anchored in text ({unanchoredIssues.length})
                </p>
                {unanchoredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-white rounded-lg border border-dashed border-gray-300 p-4 mb-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          BADGE_CLASSES[issue.severity] || BADGE_CLASSES.suggestion
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {issue.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {issue.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {issue.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rewrite Drawer */}
      {rewriteIssue && (
        <RewriteDrawer
          issue={{
            id: rewriteIssue.id,
            title: rewriteIssue.title,
            description: rewriteIssue.description,
            evidence: rewriteIssue.evidence || undefined,
            suggestion: rewriteIssue.suggestion || undefined,
          }}
          onClose={() => setRewriteIssue(null)}
          onAccept={() => {
            setRewriteIssue(null);
            onIssuesChanged();
          }}
          onReject={() => setRewriteIssue(null)}
        />
      )}
    </div>
  );
}
