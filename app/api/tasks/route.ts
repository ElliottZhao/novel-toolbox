import { NextResponse } from 'next/server';
import { taskQueue } from '@/lib/queue';
import { FETCH_CATALOG_TASK, FETCH_BOOK_CONTENT_TASK } from '@/lib/tasks';
import { z } from 'zod';

const taskSchema = z.object({
  taskType: z.enum([FETCH_CATALOG_TASK, FETCH_BOOK_CONTENT_TASK]),
  bookId: z.string(),
});

export async function GET(request: Request) {
  try {
    const jobs = await taskQueue.getJobs(['active', 'waiting']);
    const jobStatuses = await Promise.all(
      jobs.map(async (job) => ({
        id: job.id,
        state: await job.getState(),
        progress: job.progress,
        returnValue: job.returnvalue,
      }))
    );
    return NextResponse.json(jobStatuses);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get tasks', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = taskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { taskType, bookId } = validation.data;

    const job = await taskQueue.add(taskType, { bookId });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create task', details: errorMessage },
      { status: 500 }
    );
  }
} 