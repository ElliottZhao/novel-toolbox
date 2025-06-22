"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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

interface CharacterAnnotationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText: string
  paragraphId: number
  bookId: number
  characters: Character[]
  selectionInfo: {
    startIndex: number
    endIndex: number
    selectedText: string
  } | null
  onAnnotationCreated: (newAnnotation: CharacterAnnotation, updatedCharacter?: Character) => void
}

export function CharacterAnnotationSheet({
  open,
  onOpenChange,
  selectedText,
  paragraphId,
  bookId,
  characters,
  selectionInfo,
  onAnnotationCreated,
}: CharacterAnnotationSheetProps) {
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newCharacterDescription, setNewCharacterDescription] = useState("")
  const [newCharacterAliases, setNewCharacterAliases] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  // 检查选中文本是否与角色名称匹配
  const getCharacterMatchScore = (character: Character, selectedText: string) => {
    const cleanSelected = selectedText.trim()
    const searchTerms = [character.name, ...(character.aliases || [])]
    
    let bestScore = 0
    
    searchTerms.forEach(term => {
      const cleanTerm = term.trim()
      if (!cleanTerm) return
      
      // 完全匹配 - 最高优先级
      if (cleanSelected === cleanTerm) {
        bestScore = Math.max(bestScore, 100)
      }
      
      // 包含匹配 - 中等优先级
      if (cleanSelected.includes(cleanTerm) || cleanTerm.includes(cleanSelected)) {
        bestScore = Math.max(bestScore, 80)
      }
      
      // 忽略大小写匹配
      if (cleanSelected.toLowerCase() === cleanTerm.toLowerCase()) {
        bestScore = Math.max(bestScore, 90)
      }
      
      // 忽略大小写包含匹配
      if (cleanSelected.toLowerCase().includes(cleanTerm.toLowerCase()) || 
          cleanTerm.toLowerCase().includes(cleanSelected.toLowerCase())) {
        bestScore = Math.max(bestScore, 70)
      }
    })
    
    return bestScore
  }

  const matchedCharacters = characters
    .map(character => ({
      character,
      score: getCharacterMatchScore(character, selectedText)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)

  const bestMatch = matchedCharacters[0]

  // 创建新角色
  const createCharacterMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; aliases?: string[] }) => {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          bookId,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建角色失败")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter"] })
      setNewCharacterName("")
      setNewCharacterDescription("")
      setNewCharacterAliases("")
      setShowCreateForm(false)
      toast.success("角色创建成功")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // 创建角色标注
  const createAnnotationMutation = useMutation({
    mutationFn: async (characterId: number) => {
      if (!selectionInfo) {
        throw new Error("缺少选择位置信息")
      }

      const response = await fetch("/api/character-annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startIndex: selectionInfo.startIndex,
          endIndex: selectionInfo.endIndex,
          selectedText: selectionInfo.selectedText,
          characterId,
          paragraphId,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建标注失败")
      }
      return response.json()
    },
    onSuccess: (data) => {
      // 检查是否需要显示别名添加提示
      const selectedText = selectionInfo?.selectedText.trim()
      const character = characters.find(c => c.id === data.characterId)
      
      if (character && selectedText && selectedText !== character.name) {
        const currentAliases = character.aliases || []
        if (!currentAliases.includes(selectedText)) {
          toast.success(`角色标注创建成功！已将"${selectedText}"添加为"${character.name}"的别名`)
          
          // 更新角色别名并传递给父组件
          const updatedCharacter = {
            ...character,
            aliases: [...currentAliases, selectedText]
          }
          onAnnotationCreated(data, updatedCharacter)
        } else {
          toast.success("角色标注创建成功")
          onAnnotationCreated(data)
        }
      } else {
        toast.success("角色标注创建成功")
        onAnnotationCreated(data)
      }
      
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleCreateCharacter = () => {
    if (!newCharacterName.trim()) {
      toast.error("请输入角色名称")
      return
    }
    
    // 解析别名（用逗号分隔）
    const aliases = newCharacterAliases
      .split(',')
      .map(alias => alias.trim())
      .filter(alias => alias.length > 0)
    
    createCharacterMutation.mutate({
      name: newCharacterName.trim(),
      description: newCharacterDescription.trim() || undefined,
      aliases: aliases.length > 0 ? aliases : undefined,
    })
  }

  const handleSelectCharacter = (character: Character) => {
    createAnnotationMutation.mutate(character.id)
  }

  // 检查是否需要添加别名
  const getAliasPreview = (character: Character) => {
    if (!selectionInfo) return null
    
    const selectedText = selectionInfo.selectedText.trim()
    const characterName = character.name.trim()
    const currentAliases = character.aliases || []
    
    if (selectedText === characterName) {
      return null // 不需要添加别名
    }
    
    if (currentAliases.includes(selectedText)) {
      return { type: 'existing', text: `"${selectedText}" 已是 "${character.name}" 的别名` }
    }
    
    return { type: 'new', text: `将添加 "${selectedText}" 为 "${character.name}" 的别名` }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>角色标注</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div>
            <Label>选中的文本</Label>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm">{selectedText}</p>
            </div>
          </div>

          {!showCreateForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>选择角色</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  创建新角色
                </Button>
              </div>

              {matchedCharacters.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    🎯 找到 {matchedCharacters.length} 个匹配的角色，已为您优先显示
                  </p>
                </div>
              )}

              {characters.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  暂无角色，请先创建角色
                </div>
              ) : (
                <div className="space-y-2">
                  {(matchedCharacters.length > 0 ? matchedCharacters : characters.map(char => ({ character: char, score: 0 }))).map((item) => {
                    const character = item.character
                    const isMatched = item.score > 0
                    const isBestMatch = character.id === bestMatch?.character.id
                    const aliasPreview = getAliasPreview(character)
                    
                    return (
                      <div
                        key={character.id}
                        className={`p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors ${
                          isBestMatch 
                            ? "bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700" 
                            : isMatched
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                            : ""
                        }`}
                        onClick={() => handleSelectCharacter(character)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{character.name}</p>
                              {isBestMatch && (
                                <Badge variant="default" className="bg-green-600 text-white text-xs">
                                  最佳匹配
                                </Badge>
                              )}
                              {isMatched && !isBestMatch && (
                                <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                                  匹配
                                </Badge>
                              )}
                            </div>
                            {character.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {character.description}
                              </p>
                            )}
                            {character.aliases && character.aliases.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                别名: {character.aliases.join(', ')}
                              </p>
                            )}
                            {aliasPreview && (
                              <p className={`text-xs mt-1 ${
                                aliasPreview.type === 'new' 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                💡 {aliasPreview.text}
                              </p>
                            )}
                          </div>
                          <Badge variant={isBestMatch ? "default" : isMatched ? "secondary" : "outline"}>
                            {isBestMatch ? "推荐" : isMatched ? "匹配" : "选择"}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>创建新角色</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  返回选择
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-name">角色名称 *</Label>
                <Input
                  id="character-name"
                  value={newCharacterName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCharacterName(e.target.value)}
                  placeholder="请输入角色名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-description">角色描述</Label>
                <Textarea
                  id="character-description"
                  value={newCharacterDescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCharacterDescription(e.target.value)}
                  placeholder="请输入角色描述（可选）"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="character-aliases">角色别名</Label>
                <Input
                  id="character-aliases"
                  value={newCharacterAliases}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCharacterAliases(e.target.value)}
                  placeholder="请输入别名，多个别名用逗号分隔（可选）"
                />
                <p className="text-xs text-muted-foreground">
                  例如：小张, 张三, 张先生
                </p>
              </div>

              <Button
                onClick={handleCreateCharacter}
                disabled={createCharacterMutation.isPending}
                className="w-full"
              >
                {createCharacterMutation.isPending ? "创建中..." : "创建角色"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 