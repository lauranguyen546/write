import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateCleanManuscript,
  generateTrackedChangesMarkdown,
  AcceptedRevision,
  Chunk,
} from '@/lib/export/manuscript-exporter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'clean'; // 'clean' or 'tracked'
    const projectId = params.id;

    // Fetch project with manuscript and accepted revisions
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manuscripts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            chunks: {
              orderBy: { index: 'asc' },
            },
          },
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

    if (!project || project.manuscripts.length === 0) {
      return NextResponse.json(
        { error: 'Project or manuscript not found' },
        { status: 404 }
      );
    }

    const manuscript = project.manuscripts[0];
    const originalText = manuscript.originalText;

    // Prepare chunks
    const chunks: Chunk[] = manuscript.chunks.map(c => ({
      index: c.index,
      text: c.text,
      startChar: c.startChar,
      endChar: c.endChar,
      chapter: c.chapter || undefined,
      scene: c.scene || undefined,
    }));

    // Collect accepted revisions
    const acceptedRevisions: AcceptedRevision[] = [];
    
    for (const issue of project.issues) {
      for (const revision of issue.revisions) {
        if (revision.status === 'accepted' && issue.chunkId) {
          acceptedRevisions.push({
            chunkId: issue.chunkId,
            startChar: issue.startChar || 0,
            endChar: issue.endChar || 0,
            originalText: revision.originalText,
            suggestedText: revision.suggestedText,
          });
        }
      }
    }

    let output: string;
    let filename: string;
    let contentType: string;

    if (format === 'tracked') {
      output = generateTrackedChangesMarkdown(originalText, chunks, acceptedRevisions);
      filename = `revised-tracked-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
      contentType = 'text/markdown';
    } else {
      output = generateCleanManuscript(originalText, chunks, acceptedRevisions);
      filename = `revised-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
      contentType = 'text/plain';
    }

    return new NextResponse(output, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating revised manuscript:', error);
    return NextResponse.json(
      { error: 'Failed to generate revised manuscript' },
      { status: 500 }
    );
  }
}
