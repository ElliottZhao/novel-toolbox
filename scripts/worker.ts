// scripts/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { FETCH_CATALOG_TASK, FETCH_BOOK_CONTENT_TASK } from '@/lib/tasks';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

interface BaseTaskData {
  bookId: string;
}
interface FetchCatalogData extends BaseTaskData {}
interface FetchBookContentData extends BaseTaskData {}

type TaskData = FetchCatalogData | FetchBookContentData;

console.log('Worker starting...');

const worker = new Worker<TaskData>(
  'tasks',
  async (job: Job<TaskData>) => {
    console.log(`Processing job ${job.id} of type ${job.name} with data:`, job.data);
    const { bookId } = job.data;

    // Simulate a long-running task with random delay
    const delay = Math.random() * 5000 + 1000; // 1-6 seconds delay

    for (let i = 0; i <= 100; i++) {
      // Simulate work being done
      await new Promise((resolve) => setTimeout(resolve, delay / 100));
      // Update progress
      await job.updateProgress(i);
    }
    
    switch (job.name) {
      case FETCH_CATALOG_TASK:
        console.log(`Mock fetching catalog for book ${bookId}`);
        break;
      case FETCH_BOOK_CONTENT_TASK:
        console.log(`Mock fetching content for book ${bookId}`);
        break;
      default:
        throw new Error(`Unknown task type: ${job.name}`);
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