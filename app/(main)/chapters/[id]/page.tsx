"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import {
  bookSchema,
  chapterSchema,
  paragraphSchema,
  volumeSchema,
} from "@/lib/schemas"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { toast } from "sonner"

const chapterWithDetailsSchema = chapterSchema.extend({
  book: bookSchema,
  volume: volumeSchema,
  paragraphs: z.array(paragraphSchema),
})

type ChapterWithDetails = z.infer<typeof chapterWithDetailsSchema>

async function getChapter(id: string): Promise<ChapterWithDetails> {
  const response = await fetch(`/api/chapters/${id}`)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return chapterWithDetailsSchema.parse(data)
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
          <p key={p.id}>{p.text}</p>
        ))}
      </article>
    </div>
  )
} 