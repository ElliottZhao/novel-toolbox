import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"


const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required."),
  bookId: z.string().min(1, "A valid book ID is required."),
  volumeId: z.string().min(1, "A valid volume ID is required."),
  index: z.number().int(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get("bookId")

  try {
    const chapters = await prisma.chapter.findMany({
      where: bookId ? { bookId } : {},
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            fanqie_book_id: true,
            status: true,
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
        bookId: data.bookId,
        volumeId: data.volumeId,
        index: data.index,
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