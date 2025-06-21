import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ChapterStatus } from "@/app/generated/prisma"

export async function GET() {
  try {
    const totalChapters = await prisma.chapter.count()
    const analyzedChapters = await prisma.chapter.count({
      where: { status: ChapterStatus.ANALYZED },
    })
    const plotAbstractions = await prisma.analysisResult.count()

    const analysisProgress =
      totalChapters > 0 ? (analyzedChapters / totalChapters) * 100 : 0

    // Note: The 'change' and 'changeType' are placeholders.
    // A more sophisticated implementation would compare data over time.
    return NextResponse.json({
      newChapters: {
        value: totalChapters,
        change: 0,
        changeType: "increase",
      },
      analyzedChapters: {
        value: analyzedChapters,
        change: 0,
        changeType: "increase",
      },
      plotAbstractions: {
        value: plotAbstractions,
        change: 0,
        changeType: "increase",
      },
      analysisProgress: {
        value: Math.round(analysisProgress),
        change: 0,
        changeType: "increase",
      },
    })
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats." },
      { status: 500 }
    )
  }
} 