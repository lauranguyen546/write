import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { composeCurrentText } from '@/lib/versioning/version-manager';

export const dynamic = 'force-dynamic';

// Public endpoint: beta readers fetch the shared manuscript by token.
// Serves the composed current text (original + accepted revisions).
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const share = await prisma.sharedManuscript.findUnique({
      where: { token: params.token },
      include: { project: { select: { id: true, title: true } } },
    });

    if (!share || !share.active) {
      return NextResponse.json(
        { error: 'This share link is no longer available' },
        { status: 404 }
      );
    }

    const text = await composeCurrentText(share.projectId);
    if (text == null) {
      return NextResponse.json(
        { error: 'No manuscript available yet' },
        { status: 404 }
      );
    }

    // Count the view (fire-and-forget semantics; await keeps it simple)
    await prisma.sharedManuscript.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      title: share.project.title,
      text,
    });
  } catch (error) {
    console.error('Error fetching shared manuscript:', error);
    return NextResponse.json(
      { error: 'Failed to load shared manuscript' },
      { status: 500 }
    );
  }
}
