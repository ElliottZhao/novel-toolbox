// scripts/worker.ts
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  FETCH_CATALOG_TASK,
  FETCH_BOOK_CONTENT_TASK,
  FETCH_SINGLE_CHAPTER_CONTENT_TASK,
} from '@/lib/tasks';
import { PrismaClient } from '@/app/generated/prisma';
import { handleFetchCatalog } from './tasks/fetch-catalog';
import {
  handleFetchBookContent,
  handleFetchSingleChapterContent,
} from './tasks/fetch-book-content';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

interface BaseTaskData {
  bookId: number;
}
export interface FetchCatalogData extends BaseTaskData {}
export interface FetchBookContentData extends BaseTaskData {}
export interface FetchSingleChapterContentData {
  chapterId: number;
}

export type TaskData =
  | FetchCatalogData
  | FetchBookContentData
  | FetchSingleChapterContentData;

console.log('Worker starting...');

const worker = new Worker<TaskData>(
  'tasks',
  async (job: Job<TaskData>) => {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data:`,
      job.data,
    );
    
    switch (job.name) {
      case FETCH_CATALOG_TASK: {
        await handleFetchCatalog(job as Job<FetchCatalogData>, prisma);
        break;
      }
      case FETCH_BOOK_CONTENT_TASK: {
        await handleFetchBookContent(job as Job<FetchBookContentData>, prisma);
        break;
      }
      case FETCH_SINGLE_CHAPTER_CONTENT_TASK: {
        await handleFetchSingleChapterContent(
          job as Job<FetchSingleChapterContentData>,
          prisma,
        );
        break;
      }
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
