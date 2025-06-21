"use client"

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBook,
  IconBooks,
  IconFileAnalytics,
  IconGauge,
} from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "./ui/skeleton"

async function getStats() {
  const res = await fetch("/api/stats")
  if (!res.ok) {
    throw new Error("Network response was not ok")
  }
  return res.json()
}

export function SectionCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  })

  const cards = [
    {
      title: "新增章节",
      metric: data?.newChapters.value,
      icon: <IconBooks />,
      change: data?.newChapters.change,
      changeType: data?.newChapters.changeType,
    },
    {
      title: "已分析章节",
      metric: data?.analyzedChapters.value,
      icon: <IconBook />,
      change: data?.analyzedChapters.change,
      changeType: data?.analyzedChapters.changeType,
    },
    {
      title: "情节抽象",
      metric: data?.plotAbstractions.value,
      icon: <IconFileAnalytics />,
      change: data?.plotAbstractions.change,
      changeType: data?.plotAbstractions.changeType,
    },
    {
      title: "分析进度",
      metric: `${data?.analysisProgress.value}%`,
      icon: <IconGauge />,
      change: data?.analysisProgress.change,
      changeType: data?.analysisProgress.changeType,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 @lg/main:grid-cols-2 @4xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 @lg/main:grid-cols-2 @4xl/main:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card text-card-foreground flex flex-col justify-between gap-6 rounded-lg border p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <p className="text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-bold">{card.metric ?? "..."}</p>
            </div>
            <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
              {card.icon}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {card.changeType === "increase" ? (
              <IconArrowUpRight className="text-green-500" />
            ) : (
              <IconArrowDownRight className="text-red-500" />
            )}
            <span className="text-muted-foreground">
              {card.change}% since last month
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
