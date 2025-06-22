import { taskQueue } from "@/lib/queue";
import { FETCH_SINGLE_CHAPTER_CONTENT_TASK } from "@/lib/tasks";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await taskQueue.add(FETCH_SINGLE_CHAPTER_CONTENT_TASK, { chapterId: id });
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            title: true,
            author: true,
          },
        },
        volume: {
          select: {
            title: true,
            index: true,
          },
        },
        paragraphs: {
          orderBy: {
            order: "asc",
          },
          select: {
            text: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // 构建文本内容
    const content = chapter.paragraphs.map(p => p.text).join('\n\n');

    // 构建文件名
    const fileName = `${chapter.book.title || 'Unknown Book'} - ${chapter.volume.title} - ${chapter.title}.txt`;

    // 返回文本文件
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download chapter:", error);
    return NextResponse.json(
      { error: "Failed to download chapter" },
      { status: 500 }
    );
  }
} 