import { z } from "zod"

export const bookSchema = z.object({
  id: z.string(),
  bookTitle: z.string(),
  author: z.string(),
  status: z.enum(["已发布", "草稿", "已归档"]),
})

export type Book = z.infer<typeof bookSchema>

export const chapterSchema = z.object({
  id: z.string(),
  bookTitle: z.string(),
  volumeName: z.string(),
  chapterName: z.string(),
  dateAdded: z.string(),
  status: z.enum(["analyzed", "unanalyzed"]),
})

export type Chapter = z.infer<typeof chapterSchema> 