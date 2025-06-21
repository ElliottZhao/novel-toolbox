import { Job } from 'bullmq';
import { PrismaClient } from '@/app/generated/prisma';
import type { FetchBookContentData } from '../worker';

export async function handleFetchBookContent(job: Job<FetchBookContentData>, prisma: PrismaClient) {
  const bookId = Number(job.data.bookId);
  console.log(`Mock fetching content for book ${bookId}`);
  const delay = Math.random() * 5000 + 1000; // 1-6 seconds delay
  for (let i = 0; i <= 100; i++) {
    await new Promise((resolve) => setTimeout(resolve, delay / 100));
    await job.updateProgress(i);
  }
} 