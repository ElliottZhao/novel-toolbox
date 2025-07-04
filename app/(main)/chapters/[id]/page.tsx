"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import {
  bookSchema,
  chapterSchema,
  paragraphSchema,
  volumeSchema,
} from "@/lib/schemas"
import { Skeleton } from "@/components/ui/skeleton"
import { ParagraphSummarySheet } from "@/components/paragraph-summary-sheet"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import Link from "next/link"
import React from "react"
import { ParagraphGroup } from "@/components/paragraph-group"

// 角色schema
const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional().default([]),
})

// 角色标注schema
const characterAnnotationSchema = z.object({
  id: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
  selectedText: z.string(),
  character: characterSchema,
})

// 段落总结schema
const paragraphSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
  chapterId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// 扩展的段落schema，包含标注
const paragraphWithAnnotationsSchema = paragraphSchema.extend({
  annotations: z.array(characterAnnotationSchema),
})

// 扩展的书籍schema，包含角色
const bookWithCharactersSchema = bookSchema.extend({
  characters: z.array(characterSchema),
})

// 扩展的章节schema，包含所有详细信息
const chapterWithDetailsSchema = chapterSchema.extend({
  book: bookWithCharactersSchema,
  volume: volumeSchema,
  paragraphs: z.array(paragraphWithAnnotationsSchema),
  paragraphSummaries: z.array(paragraphSummarySchema),
})

export type ChapterWithDetails = z.infer<typeof chapterWithDetailsSchema>
export type CharacterAnnotation = z.infer<typeof characterAnnotationSchema>
export type ParagraphSummary = z.infer<typeof paragraphSummarySchema>

// 导航章节schema
const navigationChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  volume: volumeSchema,
  book: bookSchema,
})

// 导航数据schema
const navigationDataSchema = z.object({
  prevChapter: navigationChapterSchema.nullable(),
  nextChapter: navigationChapterSchema.nullable(),
})

type NavigationData = z.infer<typeof navigationDataSchema>

async function getChapter(id: string): Promise<ChapterWithDetails> {
  const response = await fetch(`/api/chapters/${id}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return chapterWithDetailsSchema.parse(data)
}

async function getChapterNavigation(id: string): Promise<NavigationData> {
  const response = await fetch(`/api/chapters/${id}/navigation`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return navigationDataSchema.parse(data)
}

export default function ChapterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    if (!id) {
      toast.error("无效的章节 ID。")
      router.push("/chapters")
    }
  }, [id, router])

  if (!id) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p className="text-destructive">无效的章节 ID。</p>
      </div>
    )
  }

  return <ChapterContent id={id} />
}

function ChapterContent({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<string>>(new Set())
  const [lastSelectedParagraphId, setLastSelectedParagraphId] = useState<string | null>(null)
  const [showSummarySheet, setShowSummarySheet] = useState(false)
  
  const {
    data: chapter,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chapter", id],
    queryFn: () => getChapter(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })

  const paragraphGroups = useMemo(() => {
    if (!chapter) return []

    const allParagraphs = [...chapter.paragraphs].sort((a, b) => a.order - b.order)
    if (allParagraphs.length === 0) return []

    const sortedSummaries = [...chapter.paragraphSummaries].sort(
      (a, b) => a.startIndex - b.startIndex,
    )
    const groups: {
      paragraphs: typeof allParagraphs
      summary: ParagraphSummary | null
    }[] = []
    let currentParagraphIndex = 0

    if (sortedSummaries.length === 0) {
      groups.push({ paragraphs: allParagraphs, summary: null })
      return groups.map((g, index) => ({ ...g, id: `group-${index}` }))
    }

    for (const summary of sortedSummaries) {
      const paragraphsBefore = []
      while (
        currentParagraphIndex < allParagraphs.length &&
        allParagraphs[currentParagraphIndex].order < summary.startIndex
      ) {
        paragraphsBefore.push(allParagraphs[currentParagraphIndex])
        currentParagraphIndex++
      }
      if (paragraphsBefore.length > 0) {
        groups.push({ paragraphs: paragraphsBefore, summary: null })
      }

      const paragraphsInSummary = []
      while (
        currentParagraphIndex < allParagraphs.length &&
        allParagraphs[currentParagraphIndex].order <= summary.endIndex
      ) {
        paragraphsInSummary.push(allParagraphs[currentParagraphIndex])
        currentParagraphIndex++
      }
      if (paragraphsInSummary.length > 0) {
        groups.push({ paragraphs: paragraphsInSummary, summary: summary })
      }
    }

    const paragraphsAfter = []
    while (currentParagraphIndex < allParagraphs.length) {
      paragraphsAfter.push(allParagraphs[currentParagraphIndex])
      currentParagraphIndex++
    }
    if (paragraphsAfter.length > 0) {
      groups.push({ paragraphs: paragraphsAfter, summary: null })
    }

    return groups.map((g, index) => ({ ...g, id: `group-${index}` }))
  }, [chapter])

  const {
    data: navigation,
  } = useQuery({
    queryKey: ["chapter-navigation", id],
    queryFn: () => getChapterNavigation(id),
    enabled: !!id,
  })

  // 处理段落选择，支持 Shift+点击 选择范围
  const handleParagraphSelect = (paragraphId: string, isSelected: boolean, event?: React.MouseEvent) => {
    if (event && event.shiftKey && lastSelectedParagraphId && chapter) {
      // 找到上一次和本次点击的段落索引
      const allParagraphs = [...chapter.paragraphs].sort((a, b) => a.order - b.order)
      const idx1 = allParagraphs.findIndex(p => p.id === lastSelectedParagraphId)
      const idx2 = allParagraphs.findIndex(p => p.id === paragraphId)
      if (idx1 !== -1 && idx2 !== -1) {
        const [start, end] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1]
        const idsInRange = allParagraphs.slice(start, end + 1).map(p => p.id)
        setSelectedParagraphs(prev => {
          const newSet = new Set(prev)
          idsInRange.forEach(id => {
            if (isSelected) {
              newSet.add(id)
            } else {
              newSet.delete(id)
            }
          })
          return newSet
        })
        setLastSelectedParagraphId(paragraphId)
        return
      }
    }
    // 普通单选
    setSelectedParagraphs(prev => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(paragraphId)
      } else {
        newSet.delete(paragraphId)
      }
      return newSet
    })
    setLastSelectedParagraphId(paragraphId)
  }

  // 获取选中的段落数据
  const getSelectedParagraphsData = () => {
    if (!chapter) return []
    return chapter.paragraphs
      .filter(p => selectedParagraphs.has(p.id))
      .map(p => ({
        id: p.id,
        text: p.text,
        order: p.order,
      }))
  }

  // 处理总结创建
  const handleSummaryCreated = (newSummary: ParagraphSummary) => {
    queryClient.setQueryData(
      ["chapter", id],
      (oldData: ChapterWithDetails | undefined) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          paragraphSummaries: [...oldData.paragraphSummaries, newSummary],
        }
      },
    )

    // 清空选择
    setSelectedParagraphs(new Set())
  }

  // 添加标注到本地状态
  const addAnnotationToParagraph = (
    paragraphId: string,
    newAnnotation: CharacterAnnotation,
  ) => {
    queryClient.setQueryData(
      ["chapter", id],
      (oldData: ChapterWithDetails | undefined) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          paragraphs: oldData.paragraphs.map(paragraph => {
            if (paragraph.id === paragraphId) {
              return {
                ...paragraph,
                annotations: [...paragraph.annotations, newAnnotation],
              }
            }
            return paragraph
          }),
        }
      },
    )
  }

  // 更新角色别名
  const updateCharacterAliases = (characterId: string, newAliases: string[]) => {
    queryClient.setQueryData(
      ["chapter", id],
      (oldData: ChapterWithDetails | undefined) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          book: {
            ...oldData.book,
            characters: oldData.book.characters.map(character => {
              if (character.id === characterId) {
                return {
                  ...character,
                  aliases: newAliases,
                }
              }
              return character
            }),
          },
        }
      },
    )
  }

  // 删除标注从本地状态
  const removeAnnotationFromParagraph = async (annotationId: string) => {
    try {
      // 调用API删除标注
      const response = await fetch(
        `/api/character-annotations?id=${annotationId}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        throw new Error("删除标注失败")
      }

      // 更新本地缓存
      queryClient.setQueryData(
        ["chapter", id],
        (oldData: ChapterWithDetails | undefined) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            paragraphs: oldData.paragraphs.map(paragraph => {
              return {
                ...paragraph,
                annotations: paragraph.annotations.filter(
                  annotation => annotation.id !== annotationId,
                ),
              }
            }),
          }
        },
      )

      toast.success("标注已删除")
    } catch (error) {
      toast.error("删除标注失败")
      console.error("Delete annotation error:", error)
    }
  }

  useEffect(() => {
    if (isError) {
      toast.error(`加载章节数据失败: ${(error as Error)?.message}`)
    }
  }, [isError, error])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-2 h-6 w-1/4" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p className="text-destructive">
          加载章节数据失败。 {(error as Error)?.message}
        </p>
      </div>
    )
  }

  if (!chapter) {
    return null
  }

  const selectedParagraphsData = getSelectedParagraphsData()

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/chapters">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <IconChevronLeft className="h-4 w-4" />
              返回章节列表
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-5xl">
          {chapter.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {chapter.volume.title} / {chapter.book.title}
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-4">章节内容</h2>

      <div>
        {paragraphGroups.map((group, index) => (
          <ParagraphGroup
            key={group.id}
            group={group}
            isLast={index === paragraphGroups.length - 1}
            bookId={chapter.book.id}
            characters={chapter.book.characters}
            selectedParagraphs={selectedParagraphs}
            totalSelectedCount={selectedParagraphs.size}
            onCreateSummary={() => setShowSummarySheet(true)}
            onParagraphSelect={handleParagraphSelect}
            onAnnotationCreated={(paragraphId, newAnnotation, updatedCharacter) => {
              const annotationWithFixedAliases = {
                ...newAnnotation,
                character: {
                  ...newAnnotation.character,
                  aliases: newAnnotation.character.aliases || [],
                },
              }
              addAnnotationToParagraph(paragraphId, annotationWithFixedAliases)
              if (updatedCharacter) {
                updateCharacterAliases(
                  updatedCharacter.id,
                  updatedCharacter.aliases || [],
                )
              }
            }}
            onAnnotationDeleted={removeAnnotationFromParagraph}
          />
        ))}
      </div>

      {/* 章节导航 */}
      <div className="mt-12 flex items-center justify-between border-t pt-8">
        <div className="flex-1">
          {navigation && navigation.prevChapter ? (
            <Link href={`/chapters/${navigation.prevChapter.id}`}>
              <Button variant="outline" className="flex items-center gap-2 w-full max-w-xs">
                <IconChevronLeft className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">上一章</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {navigation.prevChapter.title}
                  </div>
                </div>
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="flex items-center gap-2 w-full max-w-xs">
              <IconChevronLeft className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm text-muted-foreground">上一章</div>
                <div className="text-xs text-muted-foreground">已是第一章</div>
              </div>
            </Button>
          )}
        </div>
        <div className="flex-1 flex justify-end">
          {navigation && navigation.nextChapter ? (
            <Link href={`/chapters/${navigation.nextChapter.id}`}>
              <Button variant="outline" className="flex items-center gap-2 w-full max-w-xs">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">下一章</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {navigation.nextChapter.title}
                  </div>
                </div>
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" disabled className="flex items-center gap-2 w-full max-w-xs justify-end">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">下一章</div>
                <div className="text-xs text-muted-foreground">已是最后一章</div>
              </div>
              <IconChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 总结创建Sheet */}
      {showSummarySheet && (
        <ParagraphSummarySheet
          open={showSummarySheet}
          onOpenChange={setShowSummarySheet}
          selectedParagraphs={selectedParagraphsData}
          chapterId={chapter.id}
          onSummaryCreated={handleSummaryCreated}
        />
      )}
    </div>
  )
} 