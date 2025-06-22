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
import { Paragraph } from "@/components/paragraph"
import { useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import Link from "next/link"

// 角色schema
const characterSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional().default([]),
})

// 角色标注schema
const characterAnnotationSchema = z.object({
  id: z.number(),
  startIndex: z.number(),
  endIndex: z.number(),
  selectedText: z.string(),
  character: characterSchema,
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
})

type ChapterWithDetails = z.infer<typeof chapterWithDetailsSchema>
type CharacterAnnotation = z.infer<typeof characterAnnotationSchema>

// 导航章节schema
const navigationChapterSchema = z.object({
  id: z.number(),
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
  
  const {
    data: chapter,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["chapter", id],
    queryFn: () => getChapter(id),
    enabled: !!id,
  })

  const {
    data: navigation,
  } = useQuery({
    queryKey: ["chapter-navigation", id],
    queryFn: () => getChapterNavigation(id),
    enabled: !!id,
  })

  // 添加标注到本地状态
  const addAnnotationToParagraph = (paragraphId: number, newAnnotation: CharacterAnnotation) => {
    queryClient.setQueryData(["chapter", id], (oldData: ChapterWithDetails | undefined) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        paragraphs: oldData.paragraphs.map(paragraph => {
          if (paragraph.id === paragraphId) {
            return {
              ...paragraph,
              annotations: [...paragraph.annotations, newAnnotation]
            }
          }
          return paragraph
        })
      }
    })
  }

  // 更新角色别名
  const updateCharacterAliases = (characterId: number, newAliases: string[]) => {
    queryClient.setQueryData(["chapter", id], (oldData: ChapterWithDetails | undefined) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        book: {
          ...oldData.book,
          characters: oldData.book.characters.map(character => {
            if (character.id === characterId) {
              return {
                ...character,
                aliases: newAliases
              }
            }
            return character
          })
        }
      }
    })
  }

  // 删除标注从本地状态
  const removeAnnotationFromParagraph = (annotationId: number) => {
    queryClient.setQueryData(["chapter", id], (oldData: ChapterWithDetails | undefined) => {
      if (!oldData) return oldData
      
      return {
        ...oldData,
        paragraphs: oldData.paragraphs.map(paragraph => {
          return {
            ...paragraph,
            annotations: paragraph.annotations.filter(annotation => annotation.id !== annotationId)
          }
        })
      }
    })
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

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-5xl">
          {chapter.title}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {chapter.volume.title} / {chapter.book.title}
        </p>
      </div>

      <article className="prose prose-stone mx-auto dark:prose-invert max-w-none">
        {chapter.paragraphs.map((p) => (
          <Paragraph 
            key={p.id} 
            paragraph={p} 
            bookId={chapter.book.id}
            characters={chapter.book.characters}
            annotations={p.annotations}
            onAnnotationCreated={(newAnnotation, updatedCharacter) => {
              // 确保aliases是数组类型
              const annotationWithFixedAliases = {
                ...newAnnotation,
                character: {
                  ...newAnnotation.character,
                  aliases: newAnnotation.character.aliases || []
                }
              }
              addAnnotationToParagraph(p.id, annotationWithFixedAliases)
              if (updatedCharacter) {
                updateCharacterAliases(updatedCharacter.id, updatedCharacter.aliases || [])
              }
            }}
            onAnnotationDeleted={removeAnnotationFromParagraph}
          />
        ))}
      </article>

      {/* 章节导航 */}
      <div className="mt-12 flex items-center justify-between border-t pt-8">
        <div className="flex-1">
          {navigation?.prevChapter && (
            <Link href={`/chapters/${navigation.prevChapter.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <IconChevronLeft className="h-4 w-4" />
                <div className="text-left">
                  <div className="text-sm text-muted-foreground">上一章</div>
                </div>
              </Button>
            </Link>
          )}
        </div>
        
        <div className="flex-1 flex justify-end">
          {navigation?.nextChapter && (
            <Link href={`/chapters/${navigation.nextChapter.id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">下一章</div>
                </div>
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
} 