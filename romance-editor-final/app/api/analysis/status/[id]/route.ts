import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs/queue';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJob(params.id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Parse result JSON
    let result = null;
    if (job.resultJson) {
      try {
        result = JSON.parse(job.resultJson);
      } catch {
        result = { raw: job.resultJson };
      }
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500 }
    );
  }
}
