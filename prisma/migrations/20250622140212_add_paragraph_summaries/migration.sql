-- CreateTable
CREATE TABLE "ParagraphSummary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "startIndex" INTEGER NOT NULL,
    "endIndex" INTEGER NOT NULL,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParagraphSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParagraphSummary_chapterId_idx" ON "ParagraphSummary"("chapterId");

-- CreateIndex
CREATE INDEX "ParagraphSummary_startIndex_endIndex_idx" ON "ParagraphSummary"("startIndex", "endIndex");

-- AddForeignKey
ALTER TABLE "ParagraphSummary" ADD CONSTRAINT "ParagraphSummary_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
