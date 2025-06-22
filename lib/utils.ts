import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 角色颜色映射
const characterColors = [
  { bg: "bg-red-200", darkBg: "dark:bg-red-800", border: "border-red-300", darkBorder: "dark:border-red-600" },
  { bg: "bg-blue-200", darkBg: "dark:bg-blue-800", border: "border-blue-300", darkBorder: "dark:border-blue-600" },
  { bg: "bg-green-200", darkBg: "dark:bg-green-800", border: "border-green-300", darkBorder: "dark:border-green-600" },
  { bg: "bg-yellow-200", darkBg: "dark:bg-yellow-800", border: "border-yellow-300", darkBorder: "dark:border-yellow-600" },
  { bg: "bg-purple-200", darkBg: "dark:bg-purple-800", border: "border-purple-300", darkBorder: "dark:border-purple-600" },
  { bg: "bg-pink-200", darkBg: "dark:bg-pink-800", border: "border-pink-300", darkBorder: "dark:border-pink-600" },
  { bg: "bg-indigo-200", darkBg: "dark:bg-indigo-800", border: "border-indigo-300", darkBorder: "dark:border-indigo-600" },
  { bg: "bg-orange-200", darkBg: "dark:bg-orange-800", border: "border-orange-300", darkBorder: "dark:border-orange-600" },
  { bg: "bg-teal-200", darkBg: "dark:bg-teal-800", border: "border-teal-300", darkBorder: "dark:border-teal-600" },
  { bg: "bg-cyan-200", darkBg: "dark:bg-cyan-800", border: "border-cyan-300", darkBorder: "dark:border-cyan-600" },
]

// 预标注下划线颜色
const preAnnotationColors = [
  "border-b-2 border-red-400 dark:border-red-500",
  "border-b-2 border-blue-400 dark:border-blue-500",
  "border-b-2 border-green-400 dark:border-green-500",
  "border-b-2 border-yellow-400 dark:border-yellow-500",
  "border-b-2 border-purple-400 dark:border-purple-500",
  "border-b-2 border-pink-400 dark:border-pink-500",
  "border-b-2 border-indigo-400 dark:border-indigo-500",
  "border-b-2 border-orange-400 dark:border-orange-500",
  "border-b-2 border-teal-400 dark:border-teal-500",
  "border-b-2 border-cyan-400 dark:border-cyan-500",
]

// 为角色分配颜色的函数
export function getCharacterColor(characterId: number, isPreAnnotation: boolean = false) {
  const colorIndex = characterId % characterColors.length
  
  if (isPreAnnotation) {
    return preAnnotationColors[colorIndex]
  }
  
  const color = characterColors[colorIndex]
  return `${color.bg} ${color.darkBg} ${color.border} ${color.darkBorder}`
}
