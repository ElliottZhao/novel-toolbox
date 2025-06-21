import { z } from "zod"

// Schema for Book, aligned with Prisma's Book model
export const bookSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  author: z.string().nullable(),
  fanqie_book_id: z.string(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
})

export type Book = z.infer<typeof bookSchema>

export const volumeSchema = z.object({
  id: z.number(),
  title: z.string(),
  index: z.number(),
  bookId: z.number(),
});

export type Volume = z.infer<typeof volumeSchema>;

// Schema for Chapter, aligned with Prisma's Chapter model
export const chapterSchema = z.object({
  id: z.number(),
  title: z.string(),
  index: z.number(),
  status: z.enum(["EMPTY", "UNANALYZED", "ANALYZED"]),
  addedAt: z.string(),
  bookId: z.number(),
  volumeId: z.number(),
  book: bookSchema.optional(),
  volume: volumeSchema.optional(),
})

export type Chapter = z.infer<typeof chapterSchema>

export const paragraphSchema = z.object({
  id: z.number(),
  text: z.string(),
  order: z.number(),
  chapterId: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Paragraph = z.infer<typeof paragraphSchema> 