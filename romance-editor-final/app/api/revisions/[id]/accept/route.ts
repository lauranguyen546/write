import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional body: { suggestedText } lets the author accept an
    // edited version of the AI suggestion instead of the original.
    let editedText: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.suggestedText === 'string' && body.suggestedText.trim()) {
        editedText = body.suggestedText;
      }
    } catch {
      // No body — plain accept
    }

    const revision = await prisma.revision.update({
      where: { id: params.id },
      data: {
        status: 'accepted',
        ...(editedText && { suggestedText: editedText }),
        updatedAt: new Date(),
      },
    });

    // Accepting a rewrite resolves the underlying issue
    await prisma.issue.update({
      where: { id: revision.issueId },
      data: { status: 'resolved' },
    });

    return NextResponse.json(revision);
  } catch (error) {
    console.error('Error accepting revision:', error);
    return NextResponse.json(
      { error: 'Failed to accept revision' },
      { status: 500 }
    );
  }
}
