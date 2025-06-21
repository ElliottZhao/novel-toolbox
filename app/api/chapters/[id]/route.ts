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
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        book: true,
        volume: true,
        paragraphs: {
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Failed to fetch chapter:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
} 