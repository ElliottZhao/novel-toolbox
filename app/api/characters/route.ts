import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const createCharacterSchema = z.object({
  name: z.string().min(1, "角色名称不能为空"),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional().default([]),
  bookId: z.number().int().positive("无效的书籍ID"),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get("bookId")

    if (!bookId) {
      return NextResponse.json(
        { error: "缺少 bookId 参数" },
        { status: 400 }
      )
    }

    const characters = await prisma.character.findMany({
      where: {
        bookId: parseInt(bookId),
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(characters)
  } catch (error) {
    console.error("获取角色列表失败:", error)
    return NextResponse.json(
      { error: "获取角色列表失败" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCharacterSchema.parse(body)

    const character = await prisma.character.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        aliases: validatedData.aliases,
        bookId: validatedData.bookId,
      },
    })

    return NextResponse.json(character, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "该角色名称已存在" },
        { status: 409 }
      )
    }

    console.error("创建角色失败:", error)
    return NextResponse.json(
      { error: "创建角色失败" },
      { status: 500 }
    )
  }
} 