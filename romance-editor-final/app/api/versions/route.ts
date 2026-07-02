import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseTextManuscript } from '@/lib/processing/text-parser';
import {
  createVersion,
  listVersions,
  getVersion,
} from '@/lib/versioning/version-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const id = searchParams.get('id');

    if (id) {
      const version = await getVersion(id);
      if (!version) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }
      return NextResponse.json(version);
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId or id is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(await listVersions(projectId));
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, description, restoreId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Restore: create a fresh manuscript from a stored version's content.
    // Chunks and issues are rebuilt the next time analysis runs.
    if (restoreId) {
      const version = await getVersion(restoreId);
      if (!version || version.projectId !== projectId) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      const parsed = parseTextManuscript(version.content);
      const manuscript = await prisma.manuscript.create({
        data: {
          projectId,
          originalText: parsed.text,
        },
      });

      await createVersion(
        projectId,
        `Restored from v${version.versionNumber}`,
        'user'
      );

      return NextResponse.json({ restored: true, manuscriptId: manuscript.id });
    }

    // Manual snapshot
    const result = await createVersion(projectId, description || null, 'user');
    if (!result) {
      return NextResponse.json(
        { error: 'No manuscript to snapshot' },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
