import { z } from "zod"

// Schema for Book, aligned with Prisma's Book model
export const bookSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  author: z.string().nullable(),
  fanqie_book_id: z.string(),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
})

export type Book = z.infer<typeof bookSchema>

export const volumeSchema = z.object({
  id: z.string(),
  title: z.string(),
  index: z.number(),
  bookId: z.string(),
});

export type Volume = z.infer<typeof volumeSchema>;

// Schema for Chapter, aligned with Prisma's Chapter model
export const chapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  index: z.number(),
  status: z.enum(["EMPTY", "UNANALYZED", "ANALYZED"]),
  addedAt: z.string(),
  bookId: z.string(),
  volumeId: z.string(),
  book: bookSchema.optional(),
  volume: volumeSchema.optional(),
})

export type Chapter = z.infer<typeof chapterSchema>

export const paragraphSchema = z.object({
  id: z.string(),
  text: z.string(),
  order: z.number(),
  chapterId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Paragraph = z.infer<typeof paragraphSchema>

// Book schemas
export const createBookSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  fanqie_book_id: z.string().min(1, "Fanqie Book ID is required."),
})

export const updateBookSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
})

// Volume schemas
export const createVolumeSchema = z.object({
  title: z.string().min(1, "Title is required."),
  index: z.number().int().min(0),
  bookId: z.string().min(1, "Book ID is required."),
})

export const updateVolumeSchema = z.object({
  title: z.string().min(1, "Title is required.").optional(),
  index: z.number().int().min(0).optional(),
})

// Chapter schemas
export const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required."),
  index: z.number().int().min(0),
  bookId: z.string().min(1, "Book ID is required."),
  volumeId: z.string().min(1, "Volume ID is required."),
})

export const updateChapterSchema = z.object({
  title: z.string().min(1, "Title is required.").optional(),
  index: z.number().int().min(0).optional(),
  status: z.enum(["EMPTY", "UNANALYZED", "ANALYZED"]).optional(),
})

// Paragraph schemas
export const createParagraphSchema = z.object({
  text: z.string().min(1, "Text is required."),
  order: z.number().int().min(0),
  chapterId: z.string().min(1, "Chapter ID is required."),
})

export const updateParagraphSchema = z.object({
  text: z.string().min(1, "Text is required.").optional(),
  order: z.number().int().min(0).optional(),
})

// Character schemas
export const createCharacterSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  bookId: z.string().min(1, "Book ID is required."),
})

export const updateCharacterSchema = z.object({
  name: z.string().min(1, "Name is required.").optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
})

// Character annotation schemas
export const createCharacterAnnotationSchema = z.object({
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  selectedText: z.string().min(1, "Selected text is required."),
  characterId: z.string().min(1, "Character ID is required."),
  paragraphId: z.string().min(1, "Paragraph ID is required."),
})

export const updateCharacterAnnotationSchema = z.object({
  startIndex: z.number().int().min(0).optional(),
  endIndex: z.number().int().min(0).optional(),
  selectedText: z.string().min(1, "Selected text is required.").optional(),
  characterId: z.string().min(1, "Character ID is required.").optional(),
})

// Analysis result schemas
export const createAnalysisResultSchema = z.object({
  plotAbstractions: z.any().optional(),
  summary: z.string().optional(),
  chapterId: z.string().min(1, "Chapter ID is required."),
})

export const updateAnalysisResultSchema = z.object({
  plotAbstractions: z.any().optional(),
  summary: z.string().optional(),
}) 