import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 角色颜色数组
const characterColors = [
  "bg-red-100 text-red-800 border-red-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-yellow-100 text-yellow-800 border-yellow-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-pink-100 text-pink-800 border-pink-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-gray-100 text-gray-800 border-gray-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
]

// 预标注颜色（稍微淡一些）
const preAnnotationColors = [
  "bg-red-50 text-red-600 border-red-100",
  "bg-blue-50 text-blue-600 border-blue-100",
  "bg-green-50 text-green-600 border-green-100",
  "bg-yellow-50 text-yellow-600 border-yellow-100",
  "bg-purple-50 text-purple-600 border-purple-100",
  "bg-pink-50 text-pink-600 border-pink-100",
  "bg-indigo-50 text-indigo-600 border-indigo-100",
  "bg-gray-50 text-gray-600 border-gray-100",
  "bg-orange-50 text-orange-600 border-orange-100",
  "bg-teal-50 text-teal-600 border-teal-100",
]

// 简单的字符串哈希函数
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function getCharacterColor(characterId: string, isPreAnnotation: boolean = false) {
  const colors = isPreAnnotation ? preAnnotationColors : characterColors
  const colorIndex = hashString(characterId) % colors.length
  return colors[colorIndex]
}
