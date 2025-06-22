import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const createCharacterSchema = z.object({
  name: z.string().min(1, "角色名称不能为空"),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  bookId: z.string().min(1, "无效的书籍ID"),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get("bookId")

  if (!bookId) {
    return NextResponse.json(
      { error: "缺少 bookId 参数" },
      { status: 400 }
    )
  }

  try {
    const characters = await prisma.character.findMany({
      where: {
        bookId,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(characters)
  } catch (error) {
    console.error("Failed to fetch characters:", error)
    return NextResponse.json(
      { error: "Failed to fetch characters." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const validatedData = createCharacterSchema.parse(json)

    const newCharacter = await prisma.character.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        aliases: validatedData.aliases || [],
        bookId: validatedData.bookId,
      },
    })

    return NextResponse.json(newCharacter, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Failed to create character:", error)
    return NextResponse.json(
      { error: "Failed to create character." },
      { status: 500 }
    )
  }
} 