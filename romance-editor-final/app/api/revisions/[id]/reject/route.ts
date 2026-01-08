import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const revision = await prisma.revision.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(revision);
  } catch (error) {
    console.error('Error rejecting revision:', error);
    return NextResponse.json(
      { error: 'Failed to reject revision' },
      { status: 500 }
    );
  }
}
