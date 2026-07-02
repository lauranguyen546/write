import { ReactNode } from 'react';
import ProjectSidebar from '@/components/layout/ProjectSidebar';
import { prisma } from '@/lib/prisma';

interface ProjectLayoutProps {
  children: ReactNode;
  params: { id: string };
}

async function getProjectTitle(projectId: string): Promise<string | undefined> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { title: true },
    });
    return project?.title;
  } catch (error) {
    console.error('Failed to fetch project title:', error);
    return undefined;
  }
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const projectTitle = await getProjectTitle(params.id);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <ProjectSidebar projectTitle={projectTitle} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto ml-64">
        {children}
      </div>
    </div>
  );
}
