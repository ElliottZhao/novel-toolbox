"use client"

import React, { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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

interface ParagraphSummarySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedParagraphs: Array<{
    id: string
    text: string
    order: number
  }>
  chapterId: string
  onSummaryCreated: (summary: ParagraphSummary) => void
}

export function ParagraphSummarySheet({
  open,
  onOpenChange,
  selectedParagraphs,
  chapterId,
  onSummaryCreated,
}: ParagraphSummarySheetProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 获取选中段落的索引范围
  const startIndex = Math.min(...selectedParagraphs.map(p => p.order))
  const endIndex = Math.max(...selectedParagraphs.map(p => p.order))

  // 获取选中段落的文本内容
  const selectedText = selectedParagraphs
    .sort((a, b) => a.order - b.order)
    .map(p => p.text)
    .join("\n\n")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error("请输入总结标题")
      return
    }
    
    if (!content.trim()) {
      toast.error("请输入总结内容")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/paragraph-summaries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          startIndex,
          endIndex,
          chapterId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建总结失败")
      }

      const summary = await response.json()
      onSummaryCreated(summary)
      toast.success("总结创建成功")
      
      // 重置表单
      setTitle("")
      setContent("")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建总结失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setTitle("")
    setContent("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>创建段落总结</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* 选中的段落信息 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">选中的段落 ({selectedParagraphs.length} 个)</Label>
            <div className="text-sm text-muted-foreground">
              段落 {startIndex} - {endIndex}
            </div>
            <div className="max-h-32 overflow-y-auto rounded-md border p-3 text-sm">
              <div className="whitespace-pre-wrap">{selectedText}</div>
            </div>
          </div>

          {/* 总结表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">总结标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入总结标题"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">总结内容</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入总结内容"
                rows={8}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "创建中..." : "创建总结"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
} 