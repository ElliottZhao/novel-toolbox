"use client"

import { useState, useRef, useMemo } from "react"
import { paragraphSchema } from "@/lib/schemas"
import { z } from "zod"
import { CharacterAnnotationSheet } from "@/components/character-annotation-sheet"
import { getCharacterColor } from "@/lib/utils"
import { IconX } from "@tabler/icons-react"
import { toast } from "sonner"

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
  onAnnotationDeleted?: (annotationId: number) => void
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
              startIndex: lastIndex,
              endIndex: endIndex,
              text: searchTerm,
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

  // 删除标注
  const handleDeleteAnnotation = async (annotationId: number, event: React.MouseEvent) => {
    event.stopPropagation() // 阻止事件冒泡
    
    try {
      const response = await fetch(`/api/character-annotations?id=${annotationId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "删除标注失败")
      }
      
      // 调用父组件的回调函数更新状态
      if (onAnnotationDeleted) {
        onAnnotationDeleted(annotationId)
      }
      
      toast.success("标注删除成功")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除标注失败")
    }
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
      const colorClasses = getCharacterColor(annotation.character.id, isPreAnnotation)
      
      parts.push(
        <span
          key={`annotation-${isPreAnnotation ? `pre-${annotation.startIndex}` : annotation.id}`}
          className={`relative group cursor-pointer hover:opacity-80 ${colorClasses}`}
          title={`${isPreAnnotation ? '预标注 - ' : ''}角色: ${annotation.character.name}`}
          onClick={isPreAnnotation ? () => handlePreAnnotationClick(annotation) : undefined}
        >
          {paragraph.text.slice(annotation.startIndex, annotation.endIndex)}
          
          {/* 删除按钮 - 只对已标注的文本显示 */}
          {!isPreAnnotation && (
            <button
              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              onClick={(e) => handleDeleteAnnotation(annotation.id, e)}
              title="删除标注"
            >
              <IconX size={10} />
            </button>
          )}
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