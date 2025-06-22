import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const createAnnotationSchema = z.object({
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  selectedText: z.string().min(1),
  characterId: z.string().min(1),
  paragraphId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAnnotationSchema.parse(body)

    // 验证段落是否存在
    const paragraph = await prisma.paragraph.findUnique({
      where: { id: validatedData.paragraphId },
    })

    if (!paragraph) {
      return NextResponse.json(
        { error: "段落不存在" },
        { status: 404 }
      )
    }

    // 验证角色是否存在
    const character = await prisma.character.findUnique({
      where: { id: validatedData.characterId },
    })

    if (!character) {
      return NextResponse.json(
        { error: "角色不存在" },
        { status: 404 }
      )
    }

    // 检查标注文本是否与角色名称一致，如果不一致则添加为别名
    const selectedText = validatedData.selectedText.trim()
    const characterName = character.name.trim()
    const currentAliases = character.aliases || []
    
    if (selectedText !== characterName && 
        !currentAliases.includes(selectedText) &&
        selectedText.length > 0) {
      
      // 添加新别名
      const updatedAliases = [...currentAliases, selectedText]
      
      await prisma.character.update({
        where: { id: validatedData.characterId },
        data: { aliases: updatedAliases },
      })
    }

    // 检查是否已有重叠的标注
    const existingAnnotation = await prisma.characterAnnotation.findFirst({
      where: {
        paragraphId: validatedData.paragraphId,
        OR: [
          {
            startIndex: {
              lte: validatedData.startIndex,
            },
            endIndex: {
              gt: validatedData.startIndex,
            },
          },
          {
            startIndex: {
              lt: validatedData.endIndex,
            },
            endIndex: {
              gte: validatedData.endIndex,
            },
          },
          {
            startIndex: {
              gte: validatedData.startIndex,
            },
            endIndex: {
              lte: validatedData.endIndex,
            },
          },
        ],
      },
    })

    if (existingAnnotation) {
      return NextResponse.json(
        { error: "该文本已被标注" },
        { status: 409 }
      )
    }

    const annotation = await prisma.characterAnnotation.create({
      data: {
        startIndex: validatedData.startIndex,
        endIndex: validatedData.endIndex,
        selectedText: validatedData.selectedText,
        characterId: validatedData.characterId,
        paragraphId: validatedData.paragraphId,
      },
      include: {
        character: true,
      },
    })

    return NextResponse.json(annotation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("创建角色标注失败:", error)
    return NextResponse.json(
      { error: "创建角色标注失败" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paragraphId = searchParams.get("paragraphId")

    if (!paragraphId) {
      return NextResponse.json(
        { error: "缺少 paragraphId 参数" },
        { status: 400 }
      )
    }

    const annotations = await prisma.characterAnnotation.findMany({
      where: {
        paragraphId: paragraphId,
      },
      include: {
        character: true,
      },
      orderBy: {
        startIndex: "asc",
      },
    })

    return NextResponse.json(annotations)
  } catch (error) {
    console.error("获取角色标注失败:", error)
    return NextResponse.json(
      { error: "获取角色标注失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const annotationId = searchParams.get("id")

    if (!annotationId) {
      return NextResponse.json(
        { error: "缺少标注ID" },
        { status: 400 }
      )
    }

    // 验证标注是否存在
    const annotation = await prisma.characterAnnotation.findUnique({
      where: { id: annotationId },
    })

    if (!annotation) {
      return NextResponse.json(
        { error: "标注不存在" },
        { status: 404 }
      )
    }

    // 删除标注
    await prisma.characterAnnotation.delete({
      where: { id: annotationId },
    })

    return NextResponse.json({ message: "标注删除成功" })
  } catch (error) {
    console.error("删除角色标注失败:", error)
    return NextResponse.json(
      { error: "删除角色标注失败" },
      { status: 500 }
    )
  }
} 