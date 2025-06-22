"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconTrash, IconEdit } from "@tabler/icons-react"
import { toast } from "sonner"

interface ParagraphSummary {
  id: string
  title: string
  content: string
  startIndex: number
  endIndex: number
  chapterId: string
  createdAt: string
  updatedAt: string
}

interface SummaryPanelProps {
  summaries: ParagraphSummary[]
  onSummaryDeleted: (summaryId: string) => void
  onSummaryEdited?: (summary: ParagraphSummary) => void
}

export function SummaryPanel({ 
  summaries, 
  onSummaryDeleted, 
  onSummaryEdited 
}: SummaryPanelProps) {
  const handleDelete = async (summaryId: string) => {
    try {
      const response = await fetch(`/api/paragraph-summaries?id=${summaryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("删除总结失败")
      }

      onSummaryDeleted(summaryId)
      toast.success("总结已删除")
    } catch (error) {
      toast.error("删除总结失败")
      console.error("Delete summary error:", error)
    }
  }

  if (summaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">暂无段落总结</p>
          <p className="text-xs mt-1">选择多个段落后可以创建总结</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">段落总结</h3>
        <Badge variant="secondary">{summaries.length} 个总结</Badge>
      </div>
      
      <div className="space-y-3">
        {summaries.map((summary) => (
          <Card key={summary.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{summary.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(summary.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {onSummaryEdited && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSummaryEdited(summary)}
                      className="h-8 w-8 p-0"
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(summary.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {summary.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 