import { NextResponse } from "next/server"
import { Book } from "@/lib/schemas"

const books: Book[] = [
  {
    id: "1",
    bookTitle: "斗破苍穹",
    author: "天蚕土豆",
    status: "已发布",
  },
  {
    id: "2",
    bookTitle: "凡人修仙传",
    author: "忘语",
    status: "已发布",
  },
  {
    id: "3",
    bookTitle: "大主宰",
    author: "天蚕土豆",
    status: "已发布",
  },
  {
    id: "4",
    bookTitle: "诡秘之主",
    author: "爱潜水的乌贼",
    status: "草稿",
  },
  {
    id: "5",
    bookTitle: "雪中悍刀行",
    author: "烽火戏诸侯",
    status: "已归档",
  },
]

export async function GET() {
  return NextResponse.json(books)
} 