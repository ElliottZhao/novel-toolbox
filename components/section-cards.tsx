"use client"

import { IconTrendingUp } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

async function getStats() {
  const response = await fetch("/api/stats")
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return response.json()
}

export function SectionCards() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: getStats,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>新增章节</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.newChapters.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{data.newChapters.change}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            本周新增 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            反映了故事内容的快速扩充
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>已分析章节</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.analyzedChapters.value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{data.analyzedChapters.change}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            本周分析 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">研究工作稳步推进</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>情节抽象</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {Intl.NumberFormat().format(data.plotAbstractions.value)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{data.plotAbstractions.change}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            持续增长中 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">揭示了故事深层结构</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>分析进度</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.analysisProgress.value}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />+{data.analysisProgress.change}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            进度超过预期 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">目标 100%</div>
        </CardFooter>
      </Card>
    </div>
  )
}
