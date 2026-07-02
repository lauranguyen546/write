'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Issue {
  id: string;
  category: string;
  severity: string;
  status: string;
  chunk?: { chapter?: string | null } | null;
}

// Chart colors validated for lightness, chroma, CVD separation, and
// contrast against the surface (see dataviz palette checks).
const BAR_HUE = '#db2777'; // romance-600 — magnitude bars, single hue
const STATUS_COLORS: { [key: string]: { color: string; label: string } } = {
  resolved: { color: '#15803d', label: 'Resolved' },
  in_progress: { color: '#2563eb', label: 'In Progress' },
  todo: { color: '#6b7280', label: 'To Do' },
  dismissed: { color: '#d1d5db', label: 'Dismissed' },
};
const STATUS_ORDER = ['resolved', 'in_progress', 'todo', 'dismissed'];

const SEVERITY_DOTS: { [key: string]: string } = {
  critical: '#dc2626',
  major: '#ea580c',
  minor: '#ca8a04',
  suggestion: '#2563eb',
};
const SEVERITY_ORDER = ['critical', 'major', 'minor', 'suggestion'];

function countBy(issues: Issue[], key: (i: Issue) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const issue of issues) {
    const k = key(issue);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return counts;
}

// Horizontal bar row: label | thin bar | direct value label
function BarRow({
  label,
  value,
  max,
  dot,
}: {
  label: string;
  value: number;
  max: number;
  dot?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 group" title={`${label}: ${value}`}>
      <div className="w-32 flex-shrink-0 flex items-center gap-2 text-sm text-gray-700">
        {dot && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: dot }}
          />
        )}
        <span className="truncate capitalize">{label}</span>
      </div>
      <div className="flex-1 h-5 flex items-center">
        <div
          className="h-3 rounded-r group-hover:opacity-80 transition-opacity"
          style={{
            width: `${pct}%`,
            minWidth: value > 0 ? '3px' : '0',
            backgroundColor: BAR_HUE,
          }}
        />
        <span className="ml-2 text-sm font-medium text-gray-900 tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(`/api/issues?projectId=${projectId}`);
        if (response.ok) {
          setIssues(await response.json());
        }
      } catch (error) {
        console.error('Failed to fetch issues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [projectId]);

  const stats = useMemo(() => {
    const byStatus = countBy(issues, (i) => i.status || 'todo');
    const resolved = byStatus.get('resolved') || 0;
    const dismissed = byStatus.get('dismissed') || 0;
    const inProgress = byStatus.get('in_progress') || 0;
    const todo = byStatus.get('todo') || 0;
    const actionable = issues.length - dismissed;
    const completionPct =
      actionable > 0 ? Math.round((resolved / actionable) * 100) : 0;

    return {
      byStatus,
      byCategory: countBy(issues, (i) => i.category),
      bySeverity: countBy(issues, (i) => i.severity),
      resolved,
      dismissed,
      inProgress,
      todo,
      actionable,
      completionPct,
    };
  }, [issues]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romance-600 mx-auto mt-16"></div>
        <p className="mt-3 text-sm text-gray-600">Loading progress...</p>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Editing Progress</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Progress to Track Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Once an analysis finds issues, this dashboard tracks how much of the
              editing work is done.
            </p>
            <Link
              href={`/projects/${projectId}/analysis`}
              className="inline-block px-6 py-3 bg-romance-600 text-white rounded-lg hover:bg-romance-700 transition-colors font-medium"
            >
              Run Analysis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryEntries = Array.from(stats.byCategory.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const categoryMax = Math.max(...categoryEntries.map(([, v]) => v), 1);
  const severityEntries = SEVERITY_ORDER.filter((s) => stats.bySeverity.has(s)).map(
    (s) => [s, stats.bySeverity.get(s)!] as [string, number]
  );
  const severityMax = Math.max(...severityEntries.map(([, v]) => v), 1);

  const statusSegments = STATUS_ORDER.filter(
    (s) => (stats.byStatus.get(s) || 0) > 0
  ).map((s) => ({
    key: s,
    count: stats.byStatus.get(s)!,
    ...STATUS_COLORS[s],
  }));

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editing Progress</h1>
          <p className="text-gray-600 mt-1">
            How much of the editorial work on this manuscript is done
          </p>
        </div>

        {/* Hero: completion */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-sm font-medium text-gray-500 uppercase mb-2">
            Overall Completion
          </p>
          <div className="flex items-end gap-4 mb-4">
            <span className="text-6xl font-bold text-gray-900 leading-none tabular-nums">
              {stats.completionPct}%
            </span>
            <span className="text-sm text-gray-600 pb-1.5">
              {stats.resolved} of {stats.actionable} actionable issues resolved
              {stats.dismissed > 0 && ` · ${stats.dismissed} dismissed`}
            </span>
          </div>
          {/* Meter */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats.completionPct}%`,
                backgroundColor: '#15803d',
              }}
            />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'To Do', value: stats.todo },
            { label: 'In Progress', value: stats.inProgress },
            { label: 'Resolved', value: stats.resolved },
            { label: 'Dismissed', value: stats.dismissed },
          ].map((tile) => (
            <div
              key={tile.label}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5"
            >
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">
                {tile.label}
              </p>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {tile.value}
              </p>
            </div>
          ))}
        </div>

        {/* Status stacked bar (part-to-whole) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Issues by Status
          </h2>
          <div className="flex h-6 rounded overflow-hidden">
            {statusSegments.map((seg, idx) => (
              <div
                key={seg.key}
                title={`${seg.label}: ${seg.count}`}
                className="h-full transition-opacity hover:opacity-80"
                style={{
                  width: `${(seg.count / issues.length) * 100}%`,
                  backgroundColor: seg.color,
                  marginLeft: idx > 0 ? '2px' : 0,
                }}
              />
            ))}
          </div>
          {/* Legend with counts (direct labels) */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            {statusSegments.map((seg) => (
              <span key={seg.key} className="flex items-center gap-2 text-sm text-gray-700">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                {seg.label}
                <span className="font-medium text-gray-900 tabular-nums">
                  {seg.count}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* By category */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Issues by Category
            </h2>
            <div className="space-y-2.5">
              {categoryEntries.map(([category, count]) => (
                <BarRow
                  key={category}
                  label={category}
                  value={count}
                  max={categoryMax}
                />
              ))}
            </div>
          </div>

          {/* By severity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Issues by Severity
            </h2>
            <div className="space-y-2.5">
              {severityEntries.map(([severity, count]) => (
                <BarRow
                  key={severity}
                  label={severity}
                  value={count}
                  max={severityMax}
                  dot={SEVERITY_DOTS[severity]}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Completion counts resolved issues against all non-dismissed issues. Update
          issue statuses on the{' '}
          <Link
            href={`/projects/${projectId}/analysis`}
            className="text-romance-600 hover:text-romance-800"
          >
            Analysis page
          </Link>{' '}
          — accepting a rewrite resolves its issue automatically.
        </p>
      </div>
    </div>
  );
}
