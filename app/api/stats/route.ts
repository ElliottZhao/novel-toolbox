import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    newChapters: {
      value: 125,
      change: 10,
      changeType: "increase",
    },
    analyzedChapters: {
      value: 80,
      change: 5,
      changeType: "increase",
    },
    plotAbstractions: {
      value: 1234,
      change: 50,
      changeType: "increase",
    },
    analysisProgress: {
      value: 64,
      change: 5,
      changeType: "increase",
    },
  })
} 