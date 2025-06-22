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

    // 获取同一卷中的上一章和下一章
    const [prevChapter, nextChapter] = await Promise.all([
      prisma.chapter.findFirst({
        where: {
          volumeId: chapter.volumeId,
          index: { lt: chapter.index },
        },
        orderBy: { index: "desc" },
        select: {
          id: true,
          title: true,
          index: true,
        },
      }),
      prisma.chapter.findFirst({
        where: {
          volumeId: chapter.volumeId,
          index: { gt: chapter.index },
        },
        orderBy: { index: "asc" },
        select: {
          id: true,
          title: true,
          index: true,
        },
      }),
    ])

    return NextResponse.json({
      prevChapter: prevChapter ? {
        id: prevChapter.id,
        title: prevChapter.title,
        volume: chapter.volume,
        book: {
          id: chapter.bookId,
          title: null,
          author: null,
          fanqie_book_id: "",
          status: "DRAFT" as const,
        },
      } : null,
      nextChapter: nextChapter ? {
        id: nextChapter.id,
        title: nextChapter.title,
        volume: chapter.volume,
        book: {
          id: chapter.bookId,
          title: null,
          author: null,
          fanqie_book_id: "",
          status: "DRAFT" as const,
        },
      } : null,
    })
  } catch (error) {
    console.error("Failed to fetch chapter navigation:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapter navigation" },
      { status: 500 }
    )
  }
} 