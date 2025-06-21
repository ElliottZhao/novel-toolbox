import { Job } from 'bullmq'
import { PrismaClient } from '@/app/generated/prisma'
import { extractInitialState } from './fanqie-utils'
import type { FetchCatalogData } from '../worker'

export async function handleFetchCatalog(job: Job<FetchCatalogData>, prisma: PrismaClient) {
  const bookId = Number(job.data.bookId)
  console.log(`Fetching catalog for book ${bookId}`)
  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book || !book.fanqie_book_id) {
    throw new Error(`Book or fanqie_book_id not found for bookId: ${bookId}`)
  }

  const url = `https://fanqienovel.com/page/${book.fanqie_book_id}`
  console.log(`Fetching from ${url}`)

  await job.updateProgress(10)
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog: ${response.statusText}`)
  }
  await job.updateProgress(60)

  const content = await response.text()
  const initialState = extractInitialState(content)

  if (initialState) {
    // Update book title and author
    const bookName = initialState?.page?.bookName
    const authorName = initialState?.page?.authorName
    if (bookName && authorName) {
      await prisma.book.update({
        where: { id: bookId },
        data: { title: bookName, author: authorName },
      })
      console.log(`Updated book title to "${bookName}" and author to "${authorName}".`)
    }

    const chapterListWithVolume: any[] = initialState?.page?.chapterListWithVolume
    if (Array.isArray(chapterListWithVolume)) {
      const existingChapters = await prisma.chapter.findMany({
        where: { bookId: bookId },
        select: { fanqie_chapter_id: true },
      })
      const existingFanqieIds = new Set(
        existingChapters.map((c) => c.fanqie_chapter_id),
      )

      let newChaptersCount = 0
      for (const [volumeIndex, volumeData] of chapterListWithVolume.entries()) {
        const volumeName = volumeData?.[0]?.volume_name
        if (!volumeName) continue
        const volume = await prisma.volume.upsert({
          where: { bookId_title: { bookId: bookId, title: volumeName } },
          update: {},
          create: {
            bookId: bookId,
            title: volumeName,
            index: volumeIndex,
          },
        })

        if (Array.isArray(volumeData)) {
          for (const [chapterIndex, chapterData] of volumeData.entries()) {
            if (
              !chapterData ||
              !chapterData.itemId ||
              existingFanqieIds.has(chapterData.itemId.toString())
            ) {
              continue
            }

            await prisma.chapter.create({
              data: {
                bookId: bookId,
                volumeId: volume.id,
                title: chapterData.title,
                index: chapterIndex,
                fanqie_chapter_id: chapterData.itemId.toString(),
              },
            })
            newChaptersCount++
            existingFanqieIds.add(chapterData.itemId.toString())
          }
        }
      }
      if (newChaptersCount > 0) {
        console.log(
          `Successfully created ${newChaptersCount} new chapters in the database.`,
        )
      } else {
        console.log("No new chapters to save.")
      }
    } else {
      console.warn("Could not find chapterListWithVolume in __INITIAL_STATE__")
    }
  } else {
    console.warn('Could not find or process __INITIAL_STATE__')
  }

  await job.updateProgress(100)
}
