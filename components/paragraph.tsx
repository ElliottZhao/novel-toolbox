"use client"

import { useState, useRef, useMemo } from "react"
import { paragraphSchema } from "@/lib/schemas"
import { z } from "zod"
import { CharacterAnnotationSheet } from "@/components/character-annotation-sheet"

type Paragraph = z.infer<typeof paragraphSchema>

interface Character {
  id: number
  name: string
  description?: string | null
  aliases?: string[]
}

interface CharacterAnnotation {
  id: number
  startIndex: number
  endIndex: number
  selectedText: string
  character: Character
}

interface ParagraphProps {
  paragraph: Paragraph
  className?: string
  bookId: number
  characters: Character[]
  annotations: CharacterAnnotation[]
  onAnnotationCreated: (newAnnotation: CharacterAnnotation, updatedCharacter?: Character) => void
}

export function Paragraph({ 
  paragraph, 
  className = "", 
  bookId, 
  characters, 
  annotations,
  onAnnotationCreated
}: ParagraphProps) {
  const [selectedText, setSelectedText] = useState("")
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
      startIndex: number
      endIndex: number
      text: string
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
      
      searchTerms.forEach(searchTerm => {
        if (!searchTerm.trim()) return
        
        let searchIndex = 0
        
        while (true) {
          const index = paragraph.text.indexOf(searchTerm, searchIndex)
          if (index === -1) break
          
          const endIndex = index + searchTerm.length
          
          // 检查是否与已有标注重叠
          const isOverlapping = annotatedRanges.some(range => 
            (index >= range.start && index < range.end) ||
            (endIndex > range.start && endIndex <= range.end) ||
            (index <= range.start && endIndex >= range.end)
          )
          
          if (!isOverlapping) {
            preAnnotated.push({
              startIndex: index,
              endIndex: endIndex,
              text: searchTerm,
              character: character,
              isPreAnnotation: true
            })
          }
          
          searchIndex = endIndex
        }
      })
    })

    return preAnnotated
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
          setSelectedText(selectedText)
          setShowAnnotationSheet(true)
          setSelectionInfo({
            startIndex: fallbackStartIndex,
            endIndex: fallbackEndIndex,
            selectedText
          })
        }
        return
      }
      
      setSelectedText(selectedText)
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

      setSelectedText(selectedText)
      setShowAnnotationSheet(true)
      
      setSelectionInfo({
        startIndex,
        endIndex,
        selectedText
      })
    }
  }

  // 处理预标注点击
  const handlePreAnnotationClick = (preAnnotation: typeof preAnnotations[0]) => {
    setSelectedText(preAnnotation.text)
    setShowAnnotationSheet(true)
    setSelectionInfo({
      startIndex: preAnnotation.startIndex,
      endIndex: preAnnotation.endIndex,
      selectedText: preAnnotation.text
    })
  }

  // 渲染带标注的文本
  const renderAnnotatedText = () => {
    // 合并已标注和预标注，按位置排序
    const allAnnotations = [
      ...annotations.map(a => ({ ...a, isPreAnnotation: false as const })),
      ...preAnnotations
    ].sort((a, b) => a.startIndex - b.startIndex)
    
    if (allAnnotations.length === 0) {
      return paragraph.text
    }
    
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    allAnnotations.forEach((annotation) => {
      // 添加标注前的文本
      if (annotation.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {paragraph.text.slice(lastIndex, annotation.startIndex)}
          </span>
        )
      }

      // 添加标注的文本
      const isPreAnnotation = 'isPreAnnotation' in annotation && annotation.isPreAnnotation
      parts.push(
        <span
          key={`annotation-${isPreAnnotation ? `pre-${annotation.startIndex}` : annotation.id}`}
          className={`cursor-pointer hover:opacity-80 ${
            isPreAnnotation 
              ? "bg-blue-200 dark:bg-blue-800 border border-blue-300 dark:border-blue-600" 
              : "bg-yellow-200 dark:bg-yellow-800"
          }`}
          title={`${isPreAnnotation ? '预标注 - ' : ''}角色: ${annotation.character.name}`}
          onClick={isPreAnnotation ? () => handlePreAnnotationClick(annotation) : undefined}
        >
          {paragraph.text.slice(annotation.startIndex, annotation.endIndex)}
        </span>
      )

      lastIndex = annotation.endIndex
    })

    // 添加剩余的文本
    if (lastIndex < paragraph.text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {paragraph.text.slice(lastIndex)}
        </span>
      )
    }

    return parts
  }

  return (
    <>
      <p 
        ref={paragraphRef}
        className={`leading-relaxed select-text ${className}`}
        data-paragraph-id={paragraph.id}
        onMouseUp={handleMouseUp}
      >
        {renderAnnotatedText()}
      </p>

      <CharacterAnnotationSheet
        open={showAnnotationSheet}
        onOpenChange={setShowAnnotationSheet}
        selectedText={selectedText}
        paragraphId={paragraph.id}
        bookId={bookId}
        characters={characters}
        selectionInfo={selectionInfo}
        onAnnotationCreated={onAnnotationCreated}
      />
    </>
  )
} 