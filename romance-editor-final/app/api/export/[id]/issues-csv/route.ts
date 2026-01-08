import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateIssuesCSV, IssueForExport } from '@/lib/export/csv-exporter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // Fetch project with issues
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        issues: {
          include: {
            chunk: {
              select: {
                chapter: true,
                scene: true,
              },
            },
            revisions: {
              where: { status: 'accepted' },
            },
          },
          orderBy: [
            { severity: 'desc' },
            { category: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const issuesForExport: IssueForExport[] = project.issues.map(issue => ({
      id: issue.id,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      evidence: issue.evidence || undefined,
      suggestion: issue.suggestion || undefined,
      chapter: issue.chunk?.chapter || undefined,
      scene: issue.chunk?.scene || undefined,
      hasAcceptedRevision: issue.revisions.length > 0,
    }));

    const csv = generateIssuesCSV(issuesForExport);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="issues-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    );
  }
}
