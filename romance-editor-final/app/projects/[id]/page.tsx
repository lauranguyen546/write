import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manuscripts: {
        orderBy: { createdAt: 'desc' },
      },
      issues: true,
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!project) {
    notFound();
  }

  const settings = JSON.parse(project.settingsJson);
  const latestManuscript = project.manuscripts[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
        <p className="text-gray-600 mt-1">
          {settings.subgenre} • {settings.heatLevel} • {settings.targetTone} tone
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Manuscript section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Manuscript</h2>
            {latestManuscript ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Uploaded manuscript</p>
                    <p className="text-sm text-gray-600">
                      {new Date(latestManuscript.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/projects/${project.id}/analysis`} className="btn-primary">
                    View Analysis
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No manuscript uploaded yet</p>
                <Link href={`/projects/${project.id}/settings`} className="btn-primary">
                  Configure & Upload
                </Link>
              </div>
            )}
          </div>

          {/* Recent jobs */}
          {project.jobs.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-2">
                {project.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium capitalize">{job.type.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        job.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : job.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="card">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/projects/${project.id}/settings`}
                className="block w-full px-4 py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Edit Settings
              </Link>
              {latestManuscript && (
                <>
                  <Link
                    href={`/projects/${project.id}/analysis`}
                    className="block w-full px-4 py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    View Issues
                  </Link>
                  <Link
                    href={`/projects/${project.id}/export`}
                    className="block w-full px-4 py-2 text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Export Results
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="font-semibold mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Manuscripts:</span>
                <span className="font-medium">{project.manuscripts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issues found:</span>
                <span className="font-medium">{project.issues.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Jobs run:</span>
                <span className="font-medium">{project.jobs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
