"use client"

import React, { useState, useRef, useMemo } from "react"
import { paragraphSchema } from "@/lib/schemas"
import { z } from "zod"
import { CharacterAnnotationSheet } from "./character-annotation-sheet"
import { getCharacterColor } from "@/lib/utils"
import { toast } from "sonner"

type Paragraph = z.infer<typeof paragraphSchema>

interface Character {
  id: string
  name: string
  description?: string | null
  aliases?: string[]
}

interface CharacterAnnotation {
  id: string
  startIndex: number
  endIndex: number
  selectedText: string
  character: Character
}

interface ParagraphProps {
  paragraph: Paragraph
  className?: string
  bookId: string
  characters: Character[]
  annotations: CharacterAnnotation[]
  onAnnotationCreated: (newAnnotation: CharacterAnnotation, updatedCharacter?: Character) => void
  onAnnotationDeleted?: (annotationId: string) => void
}

export function Paragraph({ 
  paragraph, 
  className = "", 
  bookId, 
  characters, 
  annotations,
  onAnnotationCreated,
  onAnnotationDeleted
}: ParagraphProps) {
  const [showAnnotationSheet, setShowAnnotationSheet] = useState(false)
  const [selectionInfo, setSelectionInfo] = useState<{
    startIndex: number
    endIndex: number
    selectedText: string
  } | null>(null)
  const paragraphRef = useRef<HTMLParagraphElement>(null)

  // 预标注：查找未标注但匹配角色名称的文本
  const preAnnotations = useMemo(() => {
    const preAnnotated: Array<{
      id: string
      startIndex: number
      endIndex: number
      selectedText: string
      character: Character
      isPreAnnotation: true
    }> = []

    // 获取已标注的位置，避免重复
    const annotatedRanges = annotations.map(a => ({
      start: a.startIndex,
      end: a.endIndex
    }))

    // 为每个角色查找匹配的文本（包括别名）
    characters.forEach(character => {
      const searchTerms = [character.name, ...(character.aliases || [])]
        .filter(term => term.trim()) // 过滤空字符串
        .sort((a, b) => b.length - a.length) // 按长度降序排列，优先匹配更长的文本
      
      // 记录已匹配的位置，避免重叠
      const matchedPositions: Array<{start: number, end: number}> = []
      
      searchTerms.forEach(searchTerm => {
        if (!searchTerm.trim()) return
        
        // 从后向前搜索，实现后向优先
        let searchIndex = paragraph.text.length
        
        while (searchIndex > 0) {
          // 从当前位置向前查找
          const lastIndex = paragraph.text.lastIndexOf(searchTerm, searchIndex - 1)
          if (lastIndex === -1) break
          
          const endIndex = lastIndex + searchTerm.length
          
          // 检查是否与已有标注重叠
          const isOverlappingWithAnnotations = annotatedRanges.some(range => 
            (lastIndex >= range.start && lastIndex < range.end) ||
            (endIndex > range.start && endIndex <= range.end) ||
            (lastIndex <= range.start && endIndex >= range.end)
          )
          
          // 检查是否与已匹配的位置重叠
          const isOverlappingWithMatched = matchedPositions.some(pos => 
            (lastIndex >= pos.start && lastIndex < pos.end) ||
            (endIndex > pos.start && endIndex <= pos.end) ||
            (lastIndex <= pos.start && endIndex >= pos.end)
          )
          
          if (!isOverlappingWithAnnotations && !isOverlappingWithMatched) {
            preAnnotated.push({
              id: `pre-${character.id}-${lastIndex}`,
              startIndex: lastIndex,
              endIndex: endIndex,
              selectedText: searchTerm,
              character: character,
              isPreAnnotation: true
            })
            
            // 记录已匹配的位置
            matchedPositions.push({
              start: lastIndex,
              end: endIndex
            })
          }
          
          // 继续向前搜索
          searchIndex = lastIndex
        }
      })
    })

    // 按位置排序，确保渲染顺序正确
    return preAnnotated.sort((a, b) => a.startIndex - b.startIndex)
  }, [paragraph.text, characters, annotations])

  // 处理文本选择
  const handleMouseUp = () => {
    const selection = window.getSelection()
    if (!selection || selection.toString().trim() === "") {
      return
    }

    const selectedText = selection.toString().trim()
    if (selectedText.length === 0) {
      return
    }

    // 计算选中文本在段落中的位置
    const range = selection.getRangeAt(0)
    const paragraphElement = paragraphRef.current
    if (!paragraphElement) return

    // 获取段落的原始文本（不包含标注）
    const originalText = paragraph.text
    
    // 使用更精确的方法计算位置
    // 获取选中文本在DOM中的位置信息
    const startContainer = range.startContainer
    const endContainer = range.endContainer
    const startOffset = range.startOffset
    const endOffset = range.endOffset

    // 如果选中的是同一个文本节点
    if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = startContainer as Text
      
      // 计算这个文本节点在段落中的位置
      let nodeStartIndex = 0
      const walker = document.createTreeWalker(
        paragraphElement,
        NodeFilter.SHOW_TEXT,
        null
      )
      
      let found = false
      while (walker.nextNode() && !found) {
        const currentNode = walker.currentNode as Text
        if (currentNode === textNode) {
          found = true
        } else {
          nodeStartIndex += (currentNode.textContent || "").length
        }
      }
      
      const startIndex = nodeStartIndex + startOffset
      const endIndex = nodeStartIndex + endOffset
      
      // 验证计算的位置是否正确
      const extractedText = originalText.slice(startIndex, endIndex)
      if (extractedText !== selectedText) {
        console.warn("位置计算可能不准确，使用备用方法")
        // 使用备用方法
        const fallbackStartIndex = originalText.indexOf(selectedText)
        const fallbackEndIndex = fallbackStartIndex + selectedText.length
        
        if (fallbackStartIndex !== -1) {
          setShowAnnotationSheet(true)
          setSelectionInfo({
            startIndex: fallbackStartIndex,
            endIndex: fallbackEndIndex,
            selectedText
          })
        }
        return
      }
      
      setShowAnnotationSheet(true)
      
      setSelectionInfo({
        startIndex,
        endIndex,
        selectedText
      })
    } else {
      // 如果选中跨越多个节点，使用简单的indexOf方法
      const startIndex = originalText.indexOf(selectedText)
      const endIndex = startIndex + selectedText.length

      if (startIndex === -1) {
        console.warn("无法在段落中找到选中的文本")
        return
      }

      setShowAnnotationSheet(true)
      setSelectionInfo({
        startIndex,
        endIndex,
        selectedText
      })
    }
  }

  const handlePreAnnotationClick = (preAnnotation: typeof preAnnotations[0]) => {
    setShowAnnotationSheet(true)
    setSelectionInfo({
      startIndex: preAnnotation.startIndex,
      endIndex: preAnnotation.endIndex,
      selectedText: preAnnotation.selectedText
    })
  }

  const handleDeleteAnnotation = async (annotationId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!onAnnotationDeleted) return
    
    try {
      await onAnnotationDeleted(annotationId)
      toast.success("标注已删除")
    } catch (error) {
      toast.error("删除标注失败")
      console.error("Delete annotation error:", error)
    }
  }

  const renderAnnotatedText = () => {
    if (!paragraphRef.current) return paragraph.text

    const text = paragraph.text
    const elements: React.ReactNode[] = []
    let lastIndex = 0

    // 合并所有标注和预标注，按位置排序
    const allAnnotations = [
      ...annotations.map(a => ({
        ...a,
        isPreAnnotation: false as const
      })),
      ...preAnnotations
    ].sort((a, b) => a.startIndex - b.startIndex)

    allAnnotations.forEach((annotation, index) => {
      // 添加标注前的文本
      if (annotation.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>
            {text.slice(lastIndex, annotation.startIndex)}
          </span>
        )
      }

      // 添加标注文本
      const colorClass = getCharacterColor(annotation.character.id, annotation.isPreAnnotation)
      elements.push(
        <span
          key={`annotation-${index}`}
          className={`${colorClass} cursor-pointer rounded px-1 py-0.5 ${
            annotation.isPreAnnotation ? 'border-dashed' : 'border-solid'
          } border`}
          onClick={annotation.isPreAnnotation ? () => handlePreAnnotationClick(annotation) : undefined}
          title={annotation.isPreAnnotation ? `点击标注: ${annotation.character.name}` : annotation.character.name}
        >
          {annotation.selectedText}
          {!annotation.isPreAnnotation && onAnnotationDeleted && (
            <button
              className="ml-1 text-xs opacity-50 hover:opacity-100"
              onClick={(e) => handleDeleteAnnotation(annotation.id, e)}
              title="删除标注"
            >
              ×
            </button>
          )}
        </span>
      )

      lastIndex = annotation.endIndex
    })

    // 添加剩余的文本
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">
          {text.slice(lastIndex)}
        </span>
      )
    }

    return elements
  }

  return (
    <>
      <p
        ref={paragraphRef}
        className={`leading-relaxed ${className}`}
        onMouseUp={handleMouseUp}
      >
        {renderAnnotatedText()}
      </p>

      {showAnnotationSheet && selectionInfo && (
        <CharacterAnnotationSheet
          open={showAnnotationSheet}
          onOpenChange={setShowAnnotationSheet}
          selectedText={selectionInfo.selectedText}
          startIndex={selectionInfo.startIndex}
          endIndex={selectionInfo.endIndex}
          paragraphId={paragraph.id}
          bookId={bookId}
          characters={characters}
          onAnnotationCreated={(newAnnotation, updatedCharacter) => {
            onAnnotationCreated(newAnnotation, updatedCharacter)
            setShowAnnotationSheet(false)
            setSelectionInfo(null)
          }}
        />
      )}
    </>
  )
} 