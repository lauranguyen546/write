'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RewriteDrawer from '@/components/revision/RewriteDrawer';

interface Issue {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  evidence?: string;
  suggestion?: string;
  status: string;
  priority: number;
  chunkId?: string | null;
  chunk?: {
    chapter?: string;
    scene?: string;
  };
  revisions?: Array<{ id: string; status: string }>;
}

const SEVERITY_ORDER = ['critical', 'major', 'minor', 'suggestion'];

const SEVERITY_DOTS: { [key: string]: string } = {
  critical: '🔴',
  major: '🟠',
  minor: '🟡',
  suggestion: '🔵',
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', classes: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', classes: 'bg-blue-100 text-blue-800' },
  { value: 'resolved', label: 'Resolved', classes: 'bg-green-100 text-green-800' },
  { value: 'dismissed', label: 'Dismissed', classes: 'bg-gray-200 text-gray-500' },
];

const statusClasses = (status: string) =>
  STATUS_OPTIONS.find((s) => s.value === status)?.classes || STATUS_OPTIONS[0].classes;

export default function AnalysisPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [project, setProject] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [groupByChapter, setGroupByChapter] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProject();
    fetchIssues();
  }, [projectId, filterCategory, filterSeverity, filterStatus]);

  useEffect(() => {
    if (jobId && (jobStatus?.status === 'pending' || jobStatus?.status === 'running')) {
      const interval = setInterval(checkJobStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [jobId, jobStatus]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams({ projectId });
      if (filterCategory) params.append('category', filterCategory);
      if (filterSeverity) params.append('severity', filterSeverity);
      if (filterStatus) params.append('status', filterStatus);

      const response = await fetch(`/api/issues?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
        // Drop selections that are no longer visible
        setSelectedIds((prev) => {
          const visible = new Set(data.map((i: Issue) => i.id));
          return new Set(Array.from(prev).filter((id) => visible.has(id)));
        });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const updateIssues = async (ids: string[], updates: { status?: string; priority?: number }) => {
    try {
      const body = ids.length === 1 ? { id: ids[0], ...updates } : { ids, ...updates };
      const response = await fetch('/api/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        // Update local state without a full refetch
        setIssues((prev) =>
          prev.map((issue) =>
            ids.includes(issue.id) ? { ...issue, ...updates } : issue
          )
        );
      }
    } catch (error) {
      console.error('Error updating issues:', error);
    }
  };

  const handleBulkStatus = async (status: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await updateIssues(ids, { status });
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = issues.length > 0 && selectedIds.size === issues.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(issues.map((i) => i.id)));
  };

  const startAnalysis = async () => {
    if (!project?.manuscripts?.[0]) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/analysis/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          manuscriptId: project.manuscripts[0].id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobId(data.jobId);
      }
    } catch (error) {
      console.error('Error starting analysis:', error);
      setAnalyzing(false);
    }
  };

  const checkJobStatus = async () => {
    if (!jobId) return;

    try {
      const response = await fetch(`/api/analysis/status/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJobStatus(data);

        if (data.status === 'completed') {
          setAnalyzing(false);
          fetchIssues();
        } else if (data.status === 'failed') {
          setAnalyzing(false);
          alert('Analysis failed: ' + (data.result?.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  // Group issues by chapter, preserving the API's severity ordering within groups
  const chapterGroups = useMemo(() => {
    const groups = new Map<string, Issue[]>();
    issues.forEach((issue) => {
      const chapter = issue.chunk?.chapter || 'Uncategorized';
      if (!groups.has(chapter)) groups.set(chapter, []);
      groups.get(chapter)!.push(issue);
    });
    return Array.from(groups.entries());
  }, [issues]);

  const distinctChapterCount = chapterGroups.length;

  // Expand the first chapter by default when groups load
  useEffect(() => {
    if (chapterGroups.length > 0 && expandedChapters.size === 0) {
      setExpandedChapters(new Set([chapterGroups[0][0]]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterGroups.length]);

  const toggleChapter = (chapter: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) {
        next.delete(chapter);
      } else {
        next.add(chapter);
      }
      return next;
    });
  };

  const severityCounts = (chapterIssues: Issue[]) => {
    const counts: { [key: string]: number } = {};
    chapterIssues.forEach((issue) => {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    });
    return SEVERITY_ORDER.filter((sev) => counts[sev]).map((sev) => ({
      severity: sev,
      count: counts[sev],
    }));
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      major: 'bg-orange-100 text-orange-800 border-orange-300',
      minor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      suggestion: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[severity] || colors.suggestion;
  };

  const handleRewriteAccept = () => {
    fetchIssues(); // Refresh issues to show accepted status
  };

  const handleRewriteReject = () => {
    // Just close, no refresh needed
  };

  const renderIssueCard = (issue: Issue) => (
    <div
      key={issue.id}
      className={`card ${issue.status === 'dismissed' ? 'opacity-60' : ''} ${
        selectedIds.has(issue.id) ? 'ring-2 ring-romance-400' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <input
            type="checkbox"
            checked={selectedIds.has(issue.id)}
            onChange={() => toggleSelect(issue.id)}
            className="w-4 h-4 rounded border-gray-300 text-romance-600 focus:ring-romance-500"
            aria-label="Select issue"
          />
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
              issue.severity
            )}`}
          >
            {issue.severity}
          </span>
          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {issue.category}
          </span>
          {issue.chunk?.chapter && !groupByChapter && (
            <span className="text-xs text-gray-500">
              {issue.chunk.chapter}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Priority stars */}
          <div className="flex" title={`Priority ${issue.priority}/3`}>
            {[1, 2, 3].map((star) => (
              <button
                key={star}
                onClick={() => updateIssues([issue.id], { priority: star })}
                className={`text-sm ${
                  star <= issue.priority ? 'text-amber-400' : 'text-gray-300'
                } hover:text-amber-500 transition-colors`}
                aria-label={`Set priority ${star}`}
              >
                ★
              </button>
            ))}
          </div>
          {/* Status selector */}
          <select
            value={issue.status}
            onChange={(e) => updateIssues([issue.id], { status: e.target.value })}
            className={`text-xs font-medium rounded px-2 py-1 border-0 cursor-pointer ${statusClasses(
              issue.status
            )}`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <h3
        className={`text-lg font-semibold mb-2 ${
          issue.status === 'dismissed'
            ? 'text-gray-500 line-through'
            : 'text-gray-900'
        }`}
      >
        {issue.title}
      </h3>

      <p className="text-gray-700 mb-3">{issue.description}</p>

      {issue.evidence && (
        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
          <p className="text-sm text-gray-600 font-mono">{issue.evidence}</p>
        </div>
      )}

      {issue.suggestion && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-900">
            <strong>Suggestion:</strong> {issue.suggestion}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          {issue.chunkId && (
            <Link
              href={`/projects/${projectId}/manuscript?issue=${issue.id}`}
              className="text-sm font-medium text-romance-600 hover:text-romance-800 transition-colors"
            >
              📄 View in manuscript →
            </Link>
          )}
          {issue.revisions && issue.revisions.length > 0 && (
            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
              {issue.revisions.filter(r => r.status === 'accepted').length} accepted
            </span>
          )}
        </div>
        <button
          onClick={() => setSelectedIssue(issue)}
          className="px-4 py-2 bg-romance-600 text-white text-sm rounded hover:bg-romance-700 transition-colors"
        >
          Generate Rewrite
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysis</h1>
          <p className="text-gray-600">{project?.title}</p>
        </div>
        <Link href={`/projects/${projectId}`} className="btn-secondary">
          ← Back to Project
        </Link>
      </div>

      {/* Analysis Control */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Editorial Analysis</h2>

        {analyzing ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-romance-600"></div>
              <span className="font-medium">
                {jobStatus?.result?.message || 'Analyzing manuscript...'}
              </span>
            </div>
            {jobStatus?.progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-romance-600 h-2 rounded-full transition-all"
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>
            )}
          </div>
        ) : issues.length > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-700">
              Analysis complete. Found <strong>{issues.length} issues</strong>.
            </p>
            <button onClick={startAnalysis} className="btn-secondary">
              Re-run Analysis
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">
              Run editorial analysis to identify issues and get AI-powered feedback.
            </p>
            <button onClick={startAnalysis} className="btn-primary">
              Start Analysis
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {issues.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Filters</h3>
            {distinctChapterCount > 1 && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupByChapter}
                  onChange={(e) => setGroupByChapter(e.target.checked)}
                  className="rounded border-gray-300 text-romance-600 focus:ring-romance-500"
                />
                Group by chapter
              </label>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field"
              >
                <option value="">All Categories</option>
                <option value="developmental">Developmental</option>
                <option value="character">Character</option>
                <option value="scene">Scene</option>
                <option value="line">Line</option>
                <option value="repetition">Repetition</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="input-field"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="suggestion">Suggestion</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      {issues.length > 0 && (
        <div className="sticky top-0 z-30 mb-6">
          <div
            className={`card flex items-center justify-between transition-colors ${
              selectedIds.size > 0 ? 'border-romance-300 bg-romance-50' : ''
            }`}
          >
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-romance-600 focus:ring-romance-500"
              />
              {selectedIds.size > 0
                ? `${selectedIds.size} of ${issues.length} selected`
                : 'Select all'}
            </label>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatus('in_progress')}
                  className="px-3 py-1.5 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleBulkStatus('resolved')}
                  className="px-3 py-1.5 text-sm rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => handleBulkStatus('dismissed')}
                  className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issues List */}
      {issues.length > 0 ? (
        groupByChapter && distinctChapterCount > 1 ? (
          <div className="space-y-4">
            {chapterGroups.map(([chapter, chapterIssues]) => {
              const expanded = expandedChapters.has(chapter);
              return (
                <div key={chapter} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => toggleChapter(chapter)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-gray-400 transition-transform ${
                          expanded ? 'rotate-90' : ''
                        }`}
                      >
                        ▶
                      </span>
                      <span className="font-semibold text-gray-900">{chapter}</span>
                      <span className="text-sm text-gray-500">
                        ({chapterIssues.length} {chapterIssues.length === 1 ? 'issue' : 'issues'})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {severityCounts(chapterIssues).map(({ severity, count }) => (
                        <span
                          key={severity}
                          className="text-xs text-gray-700"
                          title={`${count} ${severity}`}
                        >
                          {SEVERITY_DOTS[severity]}{count}
                        </span>
                      ))}
                    </div>
                  </button>
                  {expanded && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                      {chapterIssues.map(renderIssueCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map(renderIssueCard)}
          </div>
        )
      ) : !analyzing && (
        <div className="card text-center py-12">
          <p className="text-gray-600">
            No issues found yet. Run analysis to get started.
          </p>
        </div>
      )}

      {/* Rewrite Drawer */}
      {selectedIssue && (
        <RewriteDrawer
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onAccept={handleRewriteAccept}
          onReject={handleRewriteReject}
        />
      )}
    </div>
  );
}
