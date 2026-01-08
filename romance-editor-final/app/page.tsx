import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      manuscripts: true,
      issues: true,
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
        <Link href="/projects/new" className="btn-primary">
          + New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
          <Link href="/projects/new" className="btn-primary inline-block">
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const settings = JSON.parse(project.settingsJson);
            const manuscriptCount = project.manuscripts.length;
            const issueCount = project.issues.length;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Genre:</span>{' '}
                    {settings.subgenre}
                  </p>
                  <p>
                    <span className="font-medium">Heat:</span>{' '}
                    {settings.heatLevel}
                  </p>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{manuscriptCount} manuscript(s)</span>
                  <span>{issueCount} issues</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
