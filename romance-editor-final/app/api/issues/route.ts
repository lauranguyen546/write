import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['todo', 'in_progress', 'resolved', 'dismissed'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

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
    if (status) where.status = status;

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

// Update issue workflow fields. Accepts either a single issue
// ({ id, ... }) or a bulk update ({ ids: [...], ... }).
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ids, status, priority, editingPass } = body;

    const updates: any = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = status;
    }
    if (priority !== undefined) {
      const p = Number(priority);
      if (!Number.isInteger(p) || p < 1 || p > 3) {
        return NextResponse.json(
          { error: 'priority must be an integer 1-3' },
          { status: 400 }
        );
      }
      updates.priority = p;
    }
    if (editingPass !== undefined) updates.editingPass = editingPass;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const result = await prisma.issue.updateMany({
        where: { id: { in: ids } },
        data: updates,
      });
      return NextResponse.json({ updated: result.count });
    }

    if (id) {
      const issue = await prisma.issue.update({
        where: { id },
        data: updates,
      });
      return NextResponse.json(issue);
    }

    return NextResponse.json(
      { error: 'id or ids is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating issues:', error);
    return NextResponse.json(
      { error: 'Failed to update issues' },
      { status: 500 }
    );
  }
}
