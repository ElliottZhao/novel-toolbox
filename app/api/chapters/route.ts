import { NextResponse } from "next/server"
import { Chapter } from "@/lib/schemas"

const chapters: Chapter[] = [
  {
    id: "2",
    bookTitle: "斗破苍穹",
    volumeName: "第一卷",
    chapterName: "陨落的天才",
    dateAdded: "2023-01-20",
    status: "unanalyzed",
  },
  {
    id: "3",
    bookTitle: "凡人修仙传",
    volumeName: "第一卷",
    chapterName: "山边小村",
    dateAdded: "2023-02-01",
    status: "unanalyzed",
  },
  {
    id: "5",
    bookTitle: "斗破苍穹",
    volumeName: "第一卷",
    chapterName: "斗气",
    dateAdded: "2023-02-10",
    status: "unanalyzed",
  },
  {
    id: "1",
    bookTitle: "大主宰",
    volumeName: "卷一",
    chapterName: "北灵院",
    dateAdded: "2023-01-15",
    status: "analyzed",
  },
  {
    id: "4",
    bookTitle: "大主宰",
    volumeName: "卷一",
    chapterName: "牧尘",
    dateAdded: "2023-02-05",
    status: "analyzed",
  },
  {
    id: "6",
    bookTitle: "诡秘之主",
    volumeName: "第一卷：小丑",
    chapterName: " crimson",
    dateAdded: "2024-05-10",
    status: "unanalyzed",
  },
  {
    id: "7",
    bookTitle: "诡秘之主",
    volumeName: "第一卷：小丑",
    chapterName: "观众",
    dateAdded: "2024-05-11",
    status: "analyzed",
  },
]

export async function GET() {
  return NextResponse.json(chapters)
} 