"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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

interface CharacterAnnotationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedText: string
  startIndex: number
  endIndex: number
  paragraphId: string
  bookId: string
  characters: Character[]
  onAnnotationCreated: (newAnnotation: CharacterAnnotation, updatedCharacter?: Character) => void
}

export function CharacterAnnotationSheet({
  open,
  onOpenChange,
  selectedText,
  startIndex,
  endIndex,
  paragraphId,
  bookId,
  characters,
  onAnnotationCreated,
}: CharacterAnnotationSheetProps) {
  const [newCharacterName, setNewCharacterName] = useState("")
  const [newCharacterDescription, setNewCharacterDescription] = useState("")
  const [newCharacterAliases, setNewCharacterAliases] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const queryClient = useQueryClient()

  // 自动填充角色名称
  useEffect(() => {
    if (showCreateForm) {
      setNewCharacterName(selectedText)
    }
  }, [showCreateForm, selectedText])

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

  // 获取未匹配的角色
  const unmatchedCharacters = characters
    .filter(character => !matchedCharacters.some(matched => matched.character.id === character.id))
    .map(character => ({
      character,
      score: 0
    }))

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
    mutationFn: async (characterId: string) => {
      const response = await fetch("/api/character-annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startIndex,
          endIndex,
          selectedText,
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
      const selectedTextTrimmed = selectedText.trim()
      const character = characters.find(c => c.id === data.characterId)
      
      if (character && selectedTextTrimmed && selectedTextTrimmed !== character.name) {
        const currentAliases = character.aliases || []
        if (!currentAliases.includes(selectedTextTrimmed)) {
          toast.success(`角色标注创建成功！已将"${selectedTextTrimmed}"添加为"${character.name}"的别名`)
          
          // 更新角色别名并传递给父组件
          const updatedCharacter = {
            ...character,
            aliases: [...currentAliases, selectedTextTrimmed]
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
      toast.error("角色名称不能为空")
      return
    }

    const aliases = newCharacterAliases
      .split(",")
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

  const getAliasPreview = (character: Character) => {
    const aliases = character.aliases || []
    if (aliases.length === 0) return "无别名"
    
    return aliases.slice(0, 3).join(", ") + (aliases.length > 3 ? "..." : "")
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>创建角色标注</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* 选中的文本 */}
          <div>
            <Label>选中的文本</Label>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm">{selectedText}</p>
            </div>
          </div>

          {/* 匹配的角色 */}
          {matchedCharacters.length > 0 && (
            <div>
              <Label>匹配的角色</Label>
              <div className="mt-2 space-y-2">
                {matchedCharacters.map(({ character, score }) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectCharacter(character)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{character.name}</div>
                      {character.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {character.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        别名: {getAliasPreview(character)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{score}%</Badge>
                      <Button size="sm" variant="outline">
                        选择
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 其他角色 */}
          {unmatchedCharacters.length > 0 && (
            <div>
              <Label>其他角色</Label>
              <div className="mt-2 space-y-2">
                {unmatchedCharacters.map(({ character }) => (
                  <div
                    key={character.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectCharacter(character)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{character.name}</div>
                      {character.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {character.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        别名: {getAliasPreview(character)}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      选择
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 创建新角色 */}
          <div>
            <div className="flex items-center justify-between">
              <Label>创建新角色</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "取消" : "新建角色"}
              </Button>
            </div>
            
            {showCreateForm && (
              <div className="mt-2 space-y-4 p-4 border rounded-md">
                <div>
                  <Label htmlFor="character-name">角色名称</Label>
                  <Input
                    id="character-name"
                    value={newCharacterName}
                    onChange={(e) => setNewCharacterName(e.target.value)}
                    placeholder="输入角色名称"
                  />
                </div>
                
                <div>
                  <Label htmlFor="character-description">角色描述</Label>
                  <Textarea
                    id="character-description"
                    value={newCharacterDescription}
                    onChange={(e) => setNewCharacterDescription(e.target.value)}
                    placeholder="输入角色描述（可选）"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="character-aliases">角色别名</Label>
                  <Input
                    id="character-aliases"
                    value={newCharacterAliases}
                    onChange={(e) => setNewCharacterAliases(e.target.value)}
                    placeholder="输入别名，用逗号分隔（可选）"
                  />
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
        </div>
      </SheetContent>
    </Sheet>
  )
} 