import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Returns the latest manuscript's full text plus chunk position metadata,
// which the viewer uses to anchor issue highlights and chapter navigation.
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

    // Prefer the most recent analyzed manuscript (has chunks) so issue
    // highlights line up with the text; fall back to the latest upload.
    const chunkSelect = {
      orderBy: { index: 'asc' as const },
      select: {
        id: true,
        index: true,
        chapter: true,
        scene: true,
        startChar: true,
        endChar: true,
      },
    };

    const manuscript =
      (await prisma.manuscript.findFirst({
        where: { projectId, chunks: { some: {} } },
        orderBy: { createdAt: 'desc' },
        include: { chunks: chunkSelect },
      })) ??
      (await prisma.manuscript.findFirst({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { chunks: chunkSelect },
      }));

    if (!manuscript) {
      return NextResponse.json({ manuscript: null });
    }

    return NextResponse.json({
      manuscript: {
        id: manuscript.id,
        text: manuscript.originalText,
        chunks: manuscript.chunks,
      },
    });
  } catch (error) {
    console.error('Error fetching manuscript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manuscript' },
      { status: 500 }
    );
  }
}
