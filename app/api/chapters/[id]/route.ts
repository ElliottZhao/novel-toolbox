import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            fanqie_book_id: true,
            status: true,
            characters: {
              select: {
                id: true,
                name: true,
                description: true,
                aliases: true,
              },
            },
          },
        },
        volume: {
          select: {
            id: true,
            title: true,
            index: true,
            bookId: true,
          },
        },
        paragraphs: {
          orderBy: {
            order: "asc",
          },
          include: {
            annotations: {
              include: {
                character: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    aliases: true,
                  },
                },
              },
            },
          },
        },
        paragraphSummaries: {
          orderBy: {
            startIndex: "asc",
          },
        },
        analysisResult: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(chapter)
  } catch (error) {
    console.error("Failed to fetch chapter:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    )
  }
} 