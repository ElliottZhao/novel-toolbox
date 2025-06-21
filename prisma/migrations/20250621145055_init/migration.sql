-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('EMPTY', 'UNANALYZED', 'ANALYZED');

-- CreateTable
CREATE TABLE "Book" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "author" TEXT,
    "fanqie_book_id" TEXT NOT NULL,
    "status" "BookStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volume" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "fanqie_chapter_id" TEXT,
    "status" "ChapterStatus" NOT NULL DEFAULT 'EMPTY',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookId" INTEGER NOT NULL,
    "volumeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paragraph" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paragraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" SERIAL NOT NULL,
    "plotAbstractions" JSONB,
    "summary" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chapterId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Book_fanqie_book_id_key" ON "Book"("fanqie_book_id");

-- CreateIndex
CREATE UNIQUE INDEX "Volume_bookId_index_key" ON "Volume"("bookId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Volume_bookId_title_key" ON "Volume"("bookId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_fanqie_chapter_id_key" ON "Chapter"("fanqie_chapter_id");

-- CreateIndex
CREATE INDEX "Paragraph_chapterId_order_idx" ON "Paragraph"("chapterId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_chapterId_key" ON "AnalysisResult"("chapterId");

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_volumeId_fkey" FOREIGN KEY ("volumeId") REFERENCES "Volume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paragraph" ADD CONSTRAINT "Paragraph_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalysisResult" ADD CONSTRAINT "AnalysisResult_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
