import { NextResponse } from 'next/server';
import { taskQueue } from '@/lib/queue';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const job = await taskQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;

    return NextResponse.json({ id: job.id, state, progress, returnValue });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to get task status', details: errorMessage },
      { status: 500 }
    );
  }
} 