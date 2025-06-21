import { NextResponse } from 'next/server';
import { taskQueue } from '@/lib/queue';

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
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const job = await taskQueue.add('process-task', { message });

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