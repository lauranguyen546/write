import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const manuscript = await prisma.manuscript.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        chunks: {
          orderBy: { index: 'asc' },
          select: {
            id: true,
            index: true,
            chapter: true,
            scene: true,
            startChar: true,
            endChar: true,
          },
        },
      },
    });

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
