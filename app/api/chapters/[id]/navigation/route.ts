import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        index: true,
        bookId: true,
        volumeId: true,
        volume: {
          select: {
            id: true,
            title: true,
            index: true,
            bookId: true,
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    // 获取同一本书中的上一章和下一章
    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          bookId: chapter.bookId,
          index: { lt: chapter.index },
        },
        orderBy: { index: "desc" },
        include: {
          volume: true,
        },
      }),
      prisma.chapter.findFirst({
        where: {
          bookId: chapter.bookId,
          index: { gt: chapter.index },
        },
        orderBy: { index: "asc" },
        include: {
          volume: true,
        },
      }),
    ])

    // Manually construct the response to ensure the schema matches
    const createResponse = (
      chap: {
        id: string;
        title: string;
        volume: { id: string; title: string; index: number; bookId: string };
      } | null
    ) => {
      if (!chap) return null;
      return {
        id: chap.id,
        title: chap.title,
        volume: {
          id: chap.volume.id,
          title: chap.volume.title,
          index: chap.volume.index,
          bookId: chap.volume.bookId, // Ensure bookId is here
        },
        book: {
          id: chapter.bookId,
          title: null,
          author: null,
          fanqie_book_id: "",
          status: "DRAFT" as const,
        },
      };
    };

    return NextResponse.json({
      prevChapter: createResponse(prevChapter),
      nextChapter: createResponse(nextChapter),
    })
  } catch (error) {
    console.error("Failed to fetch chapter navigation:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapter navigation" },
      { status: 500 }
    )
  }
} 