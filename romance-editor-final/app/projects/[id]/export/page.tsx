import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ExportPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manuscripts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      issues: {
        include: {
          revisions: {
            where: { status: 'accepted' },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const hasManuscript = project.manuscripts.length > 0;
  const issueCount = project.issues.length;
  const acceptedRevisionCount = project.issues.reduce(
    (sum, issue) => sum + issue.revisions.length,
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export Results</h1>
          <p className="text-gray-600">{project.title}</p>
        </div>
        <Link href={`/projects/${project.id}`} className="btn-secondary">
          ← Back to Project
        </Link>
      </div>

      {/* Status Summary */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Analysis Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold text-romance-600">{issueCount}</p>
            <p className="text-sm text-gray-600">Issues Found</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">{acceptedRevisionCount}</p>
            <p className="text-sm text-gray-600">Revisions Accepted</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">
              {hasManuscript ? '1' : '0'}
            </p>
            <p className="text-sm text-gray-600">Manuscript</p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        {/* Editorial Letter */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📝 Editorial Letter
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Professional editorial letter summarizing key findings and providing
                actionable revision guidance. Includes analysis overview, priority
                recommendations, and revision plan.
              </p>
              <p className="text-xs text-gray-500">
                Format: Markdown (.md) • Size: ~5-10 KB
              </p>
            </div>
            <a
              href={`/api/export/${project.id}/editorial-letter`}
              download
              className="btn-primary ml-4 whitespace-nowrap"
            >
              Download
            </a>
          </div>
        </div>

        {/* Issues CSV */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Issues List (CSV)
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Complete list of all identified issues in spreadsheet format. Includes
                category, severity, description, evidence, and suggestions. Perfect for
                tracking progress and organizing revision workflow.
              </p>
              <p className="text-xs text-gray-500">
                Format: CSV • {issueCount} issues • Opens in Excel/Google Sheets
              </p>
            </div>
            <a
              href={`/api/export/${project.id}/issues-csv`}
              download
              className="btn-primary ml-4 whitespace-nowrap"
            >
              Download
            </a>
          </div>
        </div>

        {/* Clean Manuscript */}
        {hasManuscript && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ✨ Revised Manuscript (Clean)
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Clean version of your manuscript with all accepted AI revisions
                  applied. Ready for further editing or submission.
                </p>
                <p className="text-xs text-gray-500">
                  Format: Plain text (.txt) • {acceptedRevisionCount} revisions applied
                </p>
              </div>
              <a
                href={`/api/export/${project.id}/manuscript?format=clean`}
                download
                className="btn-primary ml-4 whitespace-nowrap"
              >
                Download
              </a>
            </div>
          </div>
        )}

        {/* Tracked Changes Manuscript */}
        {hasManuscript && acceptedRevisionCount > 0 && (
          <div className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🔍 Revised Manuscript (Tracked Changes)
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Manuscript showing accepted revisions with markup. Original text in
                  strikethrough, new text in bold. Useful for reviewing changes before
                  finalizing.
                </p>
                <p className="text-xs text-gray-500">
                  Format: Markdown (.md) • Shows {acceptedRevisionCount} changes
                </p>
              </div>
              <a
                href={`/api/export/${project.id}/manuscript?format=tracked`}
                download
                className="btn-primary ml-4 whitespace-nowrap"
              >
                Download
              </a>
            </div>
          </div>
        )}
      </div>

      {/* No Issues Warning */}
      {issueCount === 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note:</strong> No analysis results found. Run analysis on your
            manuscript first to generate exportable results.
          </p>
          <Link
            href={`/projects/${project.id}/analysis`}
            className="inline-block mt-2 text-yellow-900 underline hover:text-yellow-700"
          >
            Go to Analysis →
          </Link>
        </div>
      )}

      {/* Export Tips */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Export Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Editorial Letter:</strong> Start here for big-picture guidance
          </li>
          <li>
            <strong>Issues CSV:</strong> Use for detailed tracking and progress monitoring
          </li>
          <li>
            <strong>Clean Manuscript:</strong> Your revised text ready for next steps
          </li>
          <li>
            <strong>Tracked Changes:</strong> Review specific revisions before committing
          </li>
        </ul>
      </div>

      {/* Workflow Suggestions */}
      <div className="mt-6 card">
        <h3 className="font-semibold text-gray-900 mb-3">Suggested Workflow</h3>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>Download and read the editorial letter for high-level guidance</li>
          <li>Review the issues CSV to prioritize what to tackle first</li>
          <li>Work through revisions in the analysis interface</li>
          <li>Download the tracked changes version to review your edits</li>
          <li>
            Download the clean manuscript when ready for the next revision pass
          </li>
        </ol>
      </div>
    </div>
  );
}
