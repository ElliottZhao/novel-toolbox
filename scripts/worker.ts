// scripts/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

// Define a type for our job data
interface TaskData {
  message: string;
}

console.log('Worker starting...');

const worker = new Worker<TaskData>(
  'tasks',
  async (job) => {
    console.log(`Processing job ${job.id} with data:`, job.data);
    // Simulate a long-running task
    for (let i = 0; i <= 100; i++) {
      // Simulate work being done
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Update progress
      await job.updateProgress(i);
    }
    console.log(`Job ${job.id} completed`);
    return { result: `Job ${job.id} done!` };
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

console.log('Worker is listening for tasks...');

const gracefulShutdown = async () => {
  console.log('Closing worker...');
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown); 