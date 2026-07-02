import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// The analysis pipeline stores the story bible and arc tracker in the
// first chunk's summaryJson (see lib/analysis/editorial-pipeline.ts).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const manuscript = await prisma.manuscript.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!manuscript) {
      return NextResponse.json({
        storyBible: null,
        arcTracker: null,
        totalChunks: 0,
      });
    }

    const [firstChunk, totalChunks] = await Promise.all([
      prisma.chunk.findFirst({
        where: { manuscriptId: manuscript.id, index: 0 },
        select: { summaryJson: true },
      }),
      prisma.chunk.count({ where: { manuscriptId: manuscript.id } }),
    ]);

    let storyBible = null;
    let arcTracker = null;

    if (firstChunk?.summaryJson) {
      try {
        const parsed = JSON.parse(firstChunk.summaryJson);
        storyBible = parsed.storyBible ?? null;
        arcTracker = parsed.arcTracker ?? null;
      } catch {
        // Malformed summary — treat as not yet analyzed
      }
    }

    return NextResponse.json({ storyBible, arcTracker, totalChunks });
  } catch (error) {
    console.error('Error fetching story bible:', error);
    return NextResponse.json(
      { error: 'Failed to fetch story bible' },
      { status: 500 }
    );
  }
}
