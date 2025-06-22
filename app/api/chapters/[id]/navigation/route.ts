import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const chapterId = parseInt(id, 10)
  if (isNaN(chapterId)) {
    return NextResponse.json({ error: "Invalid chapter ID" }, { status: 400 })
  }

  try {
    // 获取当前章节信息
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: true,
        volume: true,
      },
    })

    if (!currentChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    // 获取同一书籍的所有章节，按卷和章节索引排序
    const allChapters = await prisma.chapter.findMany({
      where: { bookId: currentChapter.bookId },
      include: {
        book: true,
        volume: true,
      },
      orderBy: [
        {
          volume: {
            index: "asc",
          },
        },
        {
          index: "asc",
        },
      ],
    })

    // 找到当前章节在排序后的数组中的位置
    const currentIndex = allChapters.findIndex(chapter => chapter.id === chapterId)
    
    // 获取上一章和下一章
    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
    const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

    return NextResponse.json({
      prevChapter: prevChapter ? {
        id: prevChapter.id,
        title: prevChapter.title,
        volume: prevChapter.volume,
        book: prevChapter.book,
      } : null,
      nextChapter: nextChapter ? {
        id: nextChapter.id,
        title: nextChapter.title,
        volume: nextChapter.volume,
        book: nextChapter.book,
      } : null,
    })
  } catch (error) {
    console.error("Failed to fetch chapter navigation:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 