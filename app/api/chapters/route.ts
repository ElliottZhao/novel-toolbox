import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"


const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required."),
  volume: z.string().optional(),
  content: z.string().min(1, "Content is required."),
  bookId: z.number().int().positive("A valid book ID is required."),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get("bookId")

  try {
    const chapters = await prisma.chapter.findMany({
      where: bookId ? { bookId: Number(bookId) } : {},
      include: {
        book: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        addedAt: "desc",
      },
    })
    return NextResponse.json(chapters)
  } catch (error) {
    console.error("Failed to fetch chapters:", error)
    return NextResponse.json(
      { error: "Failed to fetch chapters." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const data = createChapterSchema.parse(json)

    const newChapter = await prisma.chapter.create({
      data: {
        title: data.title,
        volume: data.volume,
        content: data.content,
        bookId: data.bookId,
        // Default status is UNANALYZED
      },
    })

    return NextResponse.json(newChapter, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Failed to create chapter:", error)
    return NextResponse.json(
      { error: "Failed to create chapter." },
      { status: 500 }
    )
  }
} 