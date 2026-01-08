import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Build filter
    const where: any = { projectId };
    if (category) where.category = category;
    if (severity) where.severity = severity;

    // Fetch issues
    const issues = await prisma.issue.findMany({
      where,
      include: {
        chunk: {
          select: {
            chapter: true,
            scene: true,
          },
        },
        revisions: {
          where: { status: 'proposed' },
          take: 1,
        },
      },
      orderBy: [
        { severity: 'desc' }, // Critical first
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}
