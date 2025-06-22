import { NextResponse } from 'next/server';
import { taskQueue } from '@/lib/queue';
import { z } from 'zod';

const createTaskSchema = z.object({
  taskType: z.string().min(1, "Task type is required"),
  bookId: z.string().min(1, "Book ID is required"),
});

export async function GET() {
  try {
    const jobs = await taskQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
    
    const jobData = await Promise.all(jobs.map(async job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      status: await job.getState(),
      progress: job.progress(),
      timestamp: job.timestamp,
    })));

    return NextResponse.json(jobData);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const validation = createTaskSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { taskType, bookId } = validation.data;

    const job = await taskQueue.add(taskType, { bookId });

    return NextResponse.json(
      {
        message: "Task queued successfully",
        jobId: job.id,
        taskType,
        bookId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to queue task:", error);
    return NextResponse.json(
      { error: "Failed to queue task" },
      { status: 500 }
    );
  }
} 