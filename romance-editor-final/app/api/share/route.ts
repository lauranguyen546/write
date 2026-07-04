import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Owner-side share management: get current share link, create one,
// toggle it on/off.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const share = await prisma.sharedManuscript.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { comments: true } } },
    });

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Error fetching share:', error);
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Reuse an existing share for the project; create if none
    let share = await prisma.sharedManuscript.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!share) {
      share = await prisma.sharedManuscript.create({
        data: { projectId },
      });
    } else if (!share.active) {
      share = await prisma.sharedManuscript.update({
        where: { id: share.id },
        data: { active: true },
      });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json({ error: 'Failed to create share' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, active } = body;

    if (!id || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'id and active are required' },
        { status: 400 }
      );
    }

    const share = await prisma.sharedManuscript.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Error updating share:', error);
    return NextResponse.json({ error: 'Failed to update share' }, { status: 500 });
  }
}
