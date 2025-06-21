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
    console.log('Successfully extracted __INITIAL_STATE__. Keys:', Object.keys(initialState))

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

    const chapterListWithVolume: any[][] = initialState?.page?.chapterListWithVolume
    if (Array.isArray(chapterListWithVolume)) {
      const incomingChapters = chapterListWithVolume
        .flat()
        .filter((chapter) => chapter && chapter.itemId && chapter.title)
        .map((chapter) => ({
          title: chapter.title,
          fanqie_chapter_id: chapter.itemId.toString(),
          volume: chapter.volume_name,
          content: '',
          bookId: bookId,
        }))

      if (incomingChapters.length > 0) {
        console.log(
          'First chapter data sample:',
          JSON.stringify(incomingChapters[0], null, 2)
        )

        const existingFanqieIds = (
          await prisma.chapter.findMany({
            where: {
              fanqie_chapter_id: {
                in: incomingChapters.map((c) => c.fanqie_chapter_id as string),
              },
              bookId: bookId,
            },
            select: {
              fanqie_chapter_id: true,
            },
          })
        ).map((c) => c.fanqie_chapter_id)

        const newChapters = incomingChapters.filter(
          (c) => c.fanqie_chapter_id && !existingFanqieIds.includes(c.fanqie_chapter_id)
        )

        if (newChapters.length > 0) {
          console.log(`Found ${newChapters.length} new chapters to save.`)
          const result = await prisma.chapter.createMany({
            data: newChapters,
            skipDuplicates: true,
          })
          console.log(
            `Successfully created ${result.count} new chapters in the database.`
          )
        } else {
          console.log('No new chapters to save.')
        }
      }
    } else {
      console.warn('Could not find chapterListWithVolume in __INITIAL_STATE__')
    }
  } else {
    console.warn('Could not find or process __INITIAL_STATE__')
  }

  await job.updateProgress(100)
}
