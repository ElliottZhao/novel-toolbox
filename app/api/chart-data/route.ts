import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { ChapterStatus } from "@/app/generated/prisma"

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]
}

export async function GET() {
  try {
    const chapters = await prisma.chapter.findMany({
      select: {
        addedAt: true,
        status: true,
      },
    })

    const dailyData: {
      [key: string]: { date: string; new: number; analyzed: number }
    } = {}

    for (const chapter of chapters) {
      const date = formatDate(chapter.addedAt)
      if (!dailyData[date]) {
        dailyData[date] = { date, new: 0, analyzed: 0 }
      }
      dailyData[date].new += 1
      if (chapter.status === ChapterStatus.ANALYZED) {
        dailyData[date].analyzed += 1
      }
    }

    const chartData = Object.values(dailyData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Failed to fetch chart data:", error)
    return NextResponse.json(
      { error: "Failed to fetch chart data." },
      { status: 500 }
    )
  }
} 