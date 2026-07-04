'use client';

import { useState, useEffect } from 'react';
import { usePathname, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string | number;
  shortcut?: string; // pressed after "g"
}

interface ProjectSidebarProps {
  projectTitle?: string;
}

export default function ProjectSidebar({ projectTitle }: ProjectSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [collapsed, setCollapsed] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Fetch analysis progress if there's a running job
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/jobs?projectId=${projectId}&limit=1`);
        if (response.ok) {
          const jobs = await response.json();
          if (jobs.length > 0 && jobs[0].status === 'running') {
            setAnalysisProgress(jobs[0].progress);
          } else {
            setAnalysisProgress(null);
          }
        }
      } catch (error) {
        // Silently fail
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [projectId]);

  const mainNavItems: NavItem[] = [
    { href: `/projects/${projectId}/manuscript`, label: 'Manuscript', icon: '📄', shortcut: 'm' },
    { href: `/projects/${projectId}/analysis`, label: 'Analysis', icon: '🔍', shortcut: 'a' },
    { href: `/projects/${projectId}/story-bible`, label: 'Story Bible', icon: '📚', shortcut: 'b' },
    { href: `/projects/${projectId}/romance-beats`, label: 'Romance Beats', icon: '💕', shortcut: 'r' },
    { href: `/projects/${projectId}/editorial-letter`, label: 'Editorial Letter', icon: '✉️', shortcut: 'l' },
    { href: `/projects/${projectId}/notes`, label: 'Notes', icon: '📝', shortcut: 'n' },
    { href: `/projects/${projectId}/settings/writing-rules`, label: 'Writing Rules', icon: '✍️', shortcut: 'w' },
    { href: `/projects/${projectId}/history`, label: 'History', icon: '🕐', shortcut: 'h' },
    { href: `/projects/${projectId}/feedback`, label: 'Beta Feedback', icon: '💬', shortcut: 'f' },
    { href: `/projects/${projectId}/export`, label: 'Export', icon: '📊', shortcut: 'e' },
  ];

  const secondaryNavItems: NavItem[] = [
    { href: `/projects/${projectId}/settings`, label: 'Settings', icon: '⚙️' },
    { href: `/projects/${projectId}/progress`, label: 'Progress', icon: '📈' },
  ];

  // Gmail-style shortcuts: press "g" then a letter to navigate; "?" for help
  useEffect(() => {
    let awaitingSecondKey = false;
    let timer: ReturnType<typeof setTimeout>;

    const isTyping = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }

      if (awaitingSecondKey) {
        const item = mainNavItems.find((i) => i.shortcut === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
        awaitingSecondKey = false;
        clearTimeout(timer);
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        awaitingSecondKey = true;
        timer = setTimeout(() => {
          awaitingSecondKey = false;
        }, 1500);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  const isActive = (href: string) => {
    if (href === `/projects/${projectId}/manuscript`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <Link
              href="/projects"
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Projects
            </Link>
            <h2 className="text-sm font-semibold text-gray-900 truncate mt-1">
              {projectTitle || 'Project'}
            </h2>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-2 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform ${
              collapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-romance-50 text-romance-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-sm">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-romance-100 text-romance-700 rounded-full text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>

        {/* Progress Indicator */}
        {analysisProgress !== null && !collapsed && (
          <div className="mt-4 px-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-2">
                Analysis Running
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">{analysisProgress}%</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="my-4 px-4">
          <div className="border-t border-gray-200" />
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1 px-2">
          {secondaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-romance-50 text-romance-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="flex-1 truncate text-sm">{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Quick Actions (Bottom) */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <Link
            href={`/projects/${projectId}/analysis`}
            className="block w-full px-4 py-2 bg-romance-600 text-white text-center rounded-lg hover:bg-romance-700 transition-colors text-sm font-medium"
          >
            Start Analysis
          </Link>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full text-xs text-gray-500 hover:text-gray-700 transition-colors text-center"
          >
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd> for
            shortcuts
          </button>
        </div>
      )}

      {/* Shortcuts Help Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">g</kbd>{' '}
              then a letter to jump to a page:
            </p>
            <div className="space-y-2">
              {mainNavItems.map((item) => (
                <div key={item.href} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {item.icon} {item.label}
                  </span>
                  <span className="flex gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">g</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                      {item.shortcut}
                    </kbd>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-700">Show this help</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
