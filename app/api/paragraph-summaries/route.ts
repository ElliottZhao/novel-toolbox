import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// 创建总结的schema
const createSummarySchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  content: z.string().min(1, "内容不能为空"),
  startIndex: z.number().int().min(0, "起始索引必须是非负整数"),
  endIndex: z.number().int().min(0, "结束索引必须是非负整数"),
  chapterId: z.string().min(1, "章节ID不能为空"),
})

// 获取总结的schema
const getSummariesSchema = z.object({
  chapterId: z.string().min(1, "章节ID不能为空"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSummarySchema.parse(body)

    // 验证章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id: validatedData.chapterId },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: "章节不存在" },
        { status: 404 }
      )
    }

    // 验证索引范围
    if (validatedData.startIndex > validatedData.endIndex) {
      return NextResponse.json(
        { error: "起始索引不能大于结束索引" },
        { status: 400 }
      )
    }

    // 创建总结
    const summary = await prisma.paragraphSummary.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        startIndex: validatedData.startIndex,
        endIndex: validatedData.endIndex,
        chapterId: validatedData.chapterId,
      },
    })

    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("创建段落总结失败:", error)
    return NextResponse.json(
      { error: "创建段落总结失败" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chapterId = searchParams.get("chapterId")

    const validatedData = getSummariesSchema.parse({ chapterId })

    // 获取章节的所有总结
    const summaries = await prisma.paragraphSummary.findMany({
      where: { chapterId: validatedData.chapterId },
      orderBy: { startIndex: "asc" },
    })

    return NextResponse.json(summaries)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "数据验证失败", details: error.errors },
        { status: 400 }
      )
    }

    console.error("获取段落总结失败:", error)
    return NextResponse.json(
      { error: "获取段落总结失败" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "总结ID不能为空" },
        { status: 400 }
      )
    }

    // 删除总结
    await prisma.paragraphSummary.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除段落总结失败:", error)
    return NextResponse.json(
      { error: "删除段落总结失败" },
      { status: 500 }
    )
  }
} 