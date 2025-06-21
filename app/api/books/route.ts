import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Zod schema for book creation
const createBookSchema = z.object({
  title: z.string().min(1, "Title is required."),
  author: z.string().min(1, "Author is required."),
})

export async function GET() {
  try {
    const books = await prisma.book.findMany()
    // The schema from /lib/schemas.ts is incompatible with the Prisma model.
    // We will return Prisma's model directly.
    // You may want to adjust the frontend to match.
    return NextResponse.json(books)
  } catch (error) {
    console.error("Failed to fetch books:", error)
    return NextResponse.json(
      { error: "Failed to fetch books." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { title, author } = createBookSchema.parse(json)

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        // Default status is DRAFT as per schema.prisma
      },
    })

    return NextResponse.json(newBook, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Failed to create book:", error)
    return NextResponse.json(
      { error: "Failed to create book." },
      { status: 500 }
    )
  }
} 