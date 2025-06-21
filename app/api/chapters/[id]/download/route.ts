import { taskQueue } from "@/lib/queue";
import { FETCH_SINGLE_CHAPTER_CONTENT_TASK } from "@/lib/tasks";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const chapterId = parseInt(id, 10);
  if (isNaN(chapterId)) {
    return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 });
  }

  try {
    await taskQueue.add(FETCH_SINGLE_CHAPTER_CONTENT_TASK, { chapterId });
    return NextResponse.json({
      message: "Chapter download task scheduled successfully",
    });
  } catch (error) {
    console.error("Failed to schedule chapter download task:", error);
    return NextResponse.json(
      { error: "Failed to schedule task" },
      { status: 500 },
    );
  }
} 