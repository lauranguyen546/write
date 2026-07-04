import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['praise', 'confusion', 'suggestion', 'typo', 'comment'];

// Public endpoint: beta readers submit comments on a shared manuscript.
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const share = await prisma.sharedManuscript.findUnique({
      where: { token: params.token },
    });

    if (!share || !share.active) {
      return NextResponse.json(
        { error: 'This share link is no longer available' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const readerName = String(body.readerName || '').trim().slice(0, 60);
    const text = String(body.text || '').trim().slice(0, 2000);
    const excerpt =
      typeof body.excerpt === 'string' ? body.excerpt.slice(0, 500) : null;
    const position = Number.isInteger(body.position) ? body.position : null;
    const type = VALID_TYPES.includes(body.type) ? body.type : 'comment';

    if (!readerName || !text) {
      return NextResponse.json(
        { error: 'Your name and a comment are required' },
        { status: 400 }
      );
    }

    const comment = await prisma.betaComment.create({
      data: {
        shareId: share.id,
        readerName,
        text,
        excerpt,
        position,
        type,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error creating beta comment:', error);
    return NextResponse.json(
      { error: 'Failed to save comment' },
      { status: 500 }
    );
  }
}
