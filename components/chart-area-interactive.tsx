"use client"

import * as React from "react"
import { IconLoader } from "@tabler/icons-react"
import { useQuery } from "@tanstack/react-query"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartTooltipContent } from "@/components/ui/chart"

async function getChartData() {
  const res = await fetch("/api/chart-data")
  if (!res.ok) {
    throw new Error("Failed to fetch chart data")
  }
  return res.json()
}

export function ChartAreaInteractive() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["chartData"],
    queryFn: getChartData,
  })

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <IconLoader className="animate-spin" />
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <p>No data available to display chart.</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 10,
          left: -20,
          bottom: 10,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={4}
        />
        <Tooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) =>
                new Date(value).toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
            />
          }
        />
        <Area
          dataKey="new"
          type="natural"
          fill="var(--color-new)"
          fillOpacity={0.4}
          stroke="var(--color-new)"
          stackId="a"
        />
        <Area
          dataKey="analyzed"
          type="natural"
          fill="var(--color-analyzed)"
          fillOpacity={0.4}
          stroke="var(--color-analyzed)"
          stackId="a"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
