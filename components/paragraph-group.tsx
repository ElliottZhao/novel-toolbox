"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Paragraph } from "@/components/paragraph"
import type {
  CharacterAnnotation,
  ChapterWithDetails,
  ParagraphSummary,
} from "@/app/(main)/chapters/[id]/page"
import { useMemo } from "react"
import { Button } from "./ui/button"
import { IconPlus } from "@tabler/icons-react"

type ParagraphWithAnnotations =
  ChapterWithDetails["paragraphs"][number]
type Character =
  ChapterWithDetails["book"]["characters"][number]

interface ParagraphGroupProps {
  group: {
    paragraphs: ParagraphWithAnnotations[]
    summary: ParagraphSummary | null
  }
  isLast: boolean
  bookId: string
  characters: Character[]
  selectedParagraphs: Set<string>
  totalSelectedCount: number
  onCreateSummary: () => void
  onParagraphSelect: (paragraphId: string, isSelected: boolean) => void
  onAnnotationCreated: (
    paragraphId: string,
    newAnnotation: CharacterAnnotation,
    updatedCharacter?: Character,
  ) => void
  onAnnotationDeleted: (annotationId: string) => Promise<void>
}

export function ParagraphGroup({
  group,
  isLast,
  bookId,
  characters,
  selectedParagraphs,
  totalSelectedCount,
  onCreateSummary,
  onParagraphSelect,
  onAnnotationCreated,
  onAnnotationDeleted,
}: ParagraphGroupProps) {
  const { paragraphs, summary } = group

  const hasSelectedParagraphsInGroup = useMemo(() => {
    if (totalSelectedCount === 0) return false
    const paragraphIdsInGroup = new Set(paragraphs.map(p => p.id))
    for (const selectedId of selectedParagraphs) {
      if (paragraphIdsInGroup.has(selectedId)) {
        return true
      }
    }
    return false
  }, [paragraphs, selectedParagraphs, totalSelectedCount])

  const shouldShowButton = !summary && hasSelectedParagraphsInGroup

  return (
    <div
      className={`py-4 border-t-2 border-border ${
        isLast ? "border-b-2" : ""
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <article className="prose prose-stone mx-auto dark:prose-invert max-w-none">
            {paragraphs.map(p => (
              <Paragraph
                key={p.id}
                paragraph={p}
                bookId={bookId}
                characters={characters}
                annotations={p.annotations}
                isSelected={selectedParagraphs.has(p.id)}
                onParagraphSelect={onParagraphSelect}
                showSelectionControls={true}
                onAnnotationCreated={(newAnnotation, updatedCharacter) => {
                  onAnnotationCreated(
                    p.id,
                    {
                      ...newAnnotation,
                      character: {
                        ...newAnnotation.character,
                        aliases: newAnnotation.character.aliases || [],
                      },
                    },
                    updatedCharacter
                      ? {
                          ...updatedCharacter,
                          aliases: updatedCharacter.aliases || [],
                        }
                      : undefined,
                  )
                }}
                onAnnotationDeleted={onAnnotationDeleted}
              />
            ))}
          </article>
        </div>

        <div className="lg:col-span-1">
          {summary && (
            <div className="sticky top-24">
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-blue-800 dark:text-blue-200">
                        {summary.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          段落 {summary.startIndex} - {summary.endIndex}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    {summary.content}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {shouldShowButton && (
            <div className="sticky top-24">
              <Button onClick={onCreateSummary} className="w-full">
                <IconPlus className="h-4 w-4 mr-2" />
                创建总结 ({totalSelectedCount})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 