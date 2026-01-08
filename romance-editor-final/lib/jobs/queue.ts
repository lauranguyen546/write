/**
 * Job queue management for background processing
 */

import { prisma } from '@/lib/prisma';
import { JobType, JobStatus } from '@/types';

export interface JobData {
  projectId: string;
  manuscriptId?: string;
  issueId?: string;
  options?: any;
}

/**
 * Create a new job
 */
export async function createJob(
  type: JobType,
  data: JobData
): Promise<string> {
  const job = await prisma.job.create({
    data: {
      id: crypto.randomUUID(),
      projectId: data.projectId,
      type,
      status: 'pending',
      progress: 0,
      resultJson: JSON.stringify(data),
    },
  });

  return job.id;
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
  });
}

/**
 * Update job progress
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  message?: string
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      progress,
      updatedAt: new Date(),
      resultJson: message ? JSON.stringify({ message }) : undefined,
    },
  });
}

/**
 * Update job status
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  result?: any
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      progress: status === 'completed' ? 100 : undefined,
      resultJson: result ? JSON.stringify(result) : undefined,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get pending jobs
 */
export async function getPendingJobs(limit: number = 10) {
  return prisma.job.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Mark job as running
 */
export async function markJobRunning(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'running',
      updatedAt: new Date(),
    },
  });
}

/**
 * Mark job as failed
 */
export async function markJobFailed(
  jobId: string,
  error: string
): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'failed',
      resultJson: JSON.stringify({ error }),
      updatedAt: new Date(),
    },
  });
}

/**
 * Get jobs for a project
 */
export async function getProjectJobs(
  projectId: string,
  limit: number = 20
) {
  return prisma.job.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Clean up old completed jobs (older than 7 days)
 */
export async function cleanupOldJobs(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.job.deleteMany({
    where: {
      status: 'completed',
      updatedAt: {
        lt: sevenDaysAgo,
      },
    },
  });

  return result.count;
}
