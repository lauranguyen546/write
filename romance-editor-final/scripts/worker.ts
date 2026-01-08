/**
 * Background worker for processing jobs
 * Run with: npm run worker
 */

import { prisma } from '../lib/prisma';
import {
  getPendingJobs,
  markJobRunning,
  updateJobProgress,
  updateJobStatus,
  markJobFailed,
} from '../lib/jobs/queue';
import { analyzeManuscript } from '../lib/analysis/editorial-pipeline';

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;

/**
 * Process a single job
 */
async function processJob(job: any): Promise<void> {
  console.log(`Processing job ${job.id} (${job.type})`);
  
  try {
    await markJobRunning(job.id);
    const data = JSON.parse(job.resultJson || '{}');

    if (job.type === 'analysis') {
      // Run manuscript analysis
      await analyzeManuscript(
        data.projectId,
        data.manuscriptId,
        (progress) => {
          updateJobProgress(job.id, progress.progress, progress.message);
          console.log(`[${job.id}] ${progress.stage}: ${progress.progress}%`);
        }
      );

      await updateJobStatus(job.id, 'completed', {
        message: 'Analysis completed successfully',
      });
      console.log(`Job ${job.id} completed`);
      
    } else if (job.type === 'rewrite_generation') {
      // Rewrite generation would go here (Step 7)
      await updateJobStatus(job.id, 'completed', {
        message: 'Rewrite generation completed',
      });
      
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }
    
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    await markJobFailed(
      job.id,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Main worker loop
 */
async function workerLoop(): Promise<void> {
  console.log('Worker started, polling for jobs...');

  while (true) {
    try {
      // Get pending jobs
      const jobs = await getPendingJobs(1);

      if (jobs.length > 0) {
        const job = jobs[0];
        await processJob(job);
      } else {
        // No jobs, wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
      
    } catch (error) {
      console.error('Worker error:', error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers(): void {
  const shutdown = async () => {
    console.log('\nShutting down worker...');
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

/**
 * Start the worker
 */
async function main(): Promise<void> {
  console.log('Romance Editor Background Worker');
  console.log('================================');
  console.log('Starting worker process...\n');

  setupShutdownHandlers();

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✓ Database connected');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }

  // Start worker loop
  await workerLoop();
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processJob, workerLoop };
