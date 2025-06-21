import { z } from "zod"

// Schema for Book, aligned with Prisma's Book model
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Book = z.infer<typeof bookSchema>

// Schema for Chapter, aligned with Prisma's Chapter model
export const chapterSchema = z.object({
  id: z.number(),
  title: z.string(),
  volume: z.string().nullable(),
  status: z.enum(["UNANALYZED", "ANALYZED"]),
  addedAt: z.string().datetime(),
  bookId: z.number(),
  // Including book title from the relation
  book: z.object({
    title: z.string(),
  }).optional(),
})

export type Chapter = z.infer<typeof chapterSchema> 