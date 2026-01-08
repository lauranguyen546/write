import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/lib/jobs/queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, manuscriptId } = body;

    if (!projectId || !manuscriptId) {
      return NextResponse.json(
        { error: 'Project ID and Manuscript ID are required' },
        { status: 400 }
      );
    }

    // Create analysis job
    const jobId = await createJob('analysis', {
      projectId,
      manuscriptId,
    });

    return NextResponse.json({
      jobId,
      message: 'Analysis job created. Processing will begin shortly.',
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start analysis' },
      { status: 500 }
    );
  }
}
