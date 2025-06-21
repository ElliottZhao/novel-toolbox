import { PrismaClient, BookStatus, ChapterStatus } from "../app/generated/prisma";
const prisma = new PrismaClient()

const rawBookData = [
  { bookTitle: "斗破苍穹", author: "天蚕土豆", status: "已发布" },
  { bookTitle: "凡人修仙传", author: "忘语", status: "已发布" },
  { bookTitle: "大主宰", author: "天蚕土豆", status: "已发布" },
  { bookTitle: "诡秘之主", author: "爱潜水的乌贼", status: "草稿" },
  { bookTitle: "雪中悍刀行", author: "烽火戏诸侯", status: "已归档" },
]

const rawChapterData = [
  {
    bookTitle: "斗破苍穹",
    volumeName: "第一卷",
    chapterName: "陨落的天才",
    dateAdded: "2023-01-20",
    status: "unanalyzed",
  },
  {
    bookTitle: "凡人修仙传",
    volumeName: "第一卷",
    chapterName: "山边小村",
    dateAdded: "2023-02-01",
    status: "unanalyzed",
  },
  {
    bookTitle: "斗破苍穹",
    volumeName: "第一卷",
    chapterName: "斗气",
    dateAdded: "2023-02-10",
    status: "unanalyzed",
  },
  {
    bookTitle: "大主宰",
    volumeName: "卷一",
    chapterName: "北灵院",
    dateAdded: "2023-01-15",
    status: "analyzed",
  },
  {
    bookTitle: "大主宰",
    volumeName: "卷一",
    chapterName: "牧尘",
    dateAdded: "2023-02-05",
    status: "analyzed",
  },
  {
    bookTitle: "诡秘之主",
    volumeName: "第一卷：小丑",
    chapterName: " crimson",
    dateAdded: "2024-05-10",
    status: "unanalyzed",
  },
  {
    bookTitle: "诡秘之主",
    volumeName: "第一卷：小丑",
    chapterName: "观众",
    dateAdded: "2024-05-11",
    status: "analyzed",
  },
]

// Map string statuses from Chinese to Prisma Enum values
const bookStatusMap: { [key: string]: BookStatus } = {
  已发布: BookStatus.PUBLISHED,
  草稿: BookStatus.DRAFT,
  已归档: BookStatus.ARCHIVED,
}

const chapterStatusMap: { [key: string]: ChapterStatus } = {
  unanalyzed: ChapterStatus.UNANALYZED,
  analyzed: ChapterStatus.ANALYZED,
}

async function main() {
  console.log(`Start seeding ...`)

  // Clean up existing data
  await prisma.chapter.deleteMany({})
  await prisma.analysisResult.deleteMany({})
  await prisma.book.deleteMany({})
  console.log("Deleted previous data.")

  // Seed books
  for (const book of rawBookData) {
    await prisma.book.create({
      data: {
        title: book.bookTitle,
        author: book.author,
        status: bookStatusMap[book.status],
      },
    })
  }
  console.log(`Seeded ${rawBookData.length} books.`)

  // Get created books to map titles to IDs
  const booksFromDb = await prisma.book.findMany()
  const bookMap = new Map(booksFromDb.map(b => [b.title, b.id]))

  // Seed chapters
  for (const chapter of rawChapterData) {
    const bookId = bookMap.get(chapter.bookTitle)
    if (bookId) {
      await prisma.chapter.create({
        data: {
          title: chapter.chapterName,
          volume: chapter.volumeName,
          addedAt: new Date(chapter.dateAdded),
          status: chapterStatusMap[chapter.status],
          content: "这是一个占位符内容，请替换为实际章节文本。", // Placeholder content
          book: {
            connect: { id: bookId },
          },
        },
      })
    }
  }
  console.log(`Seeded ${rawChapterData.length} chapters.`)

  console.log(`Seeding finished.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 