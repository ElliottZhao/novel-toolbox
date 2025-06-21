import { Job } from 'bullmq';
import { PrismaClient } from '@/app/generated/prisma';
import type { FetchBookContentData } from '../worker';
import { extractInitialState, parseChapterContent } from './fanqie-utils';

async function fetchPage(url: string, cookie?: string): Promise<string> {
  const headers: HeadersInit = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  };
  if (cookie) {
    headers['Cookie'] = cookie;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.statusText}`);
  }
  return response.text();
}

export async function handleFetchBookContent(job: Job<FetchBookContentData>, prisma: PrismaClient) {
  const bookId = Number(job.data.bookId);
  console.log(`Fetching content for book ${bookId}`);

  const chaptersToFetch = await prisma.chapter.findMany({
    where: {
      bookId: bookId,
      downloaded: false,
      fanqie_chapter_id: {
        not: null,
      },
    },
    take: 10,
  });

  if (chaptersToFetch.length === 0) {
    console.log(`No chapters to fetch for book ${bookId}`);
    await job.updateProgress(100);
    return;
  }

  console.log(`Found ${chaptersToFetch.length} chapters to fetch content for.`);
  let processedCount = 0;

  for (const chapter of chaptersToFetch) {
    if (!chapter.fanqie_chapter_id) continue;

    const url = `https://fanqienovel.com/reader/${chapter.fanqie_chapter_id}`;
    console.log(`Fetching content for chapter ${chapter.id} from ${url}`);

    try {
      let pageContent = await fetchPage(url);
      let initialState = extractInitialState(pageContent);

      if(!initialState) {
        console.warn(`Could not extract initial state for chapter ${chapter.id}.`);
        continue;
      }

      const isLocked = initialState?.reader?.chapterData?.isChapterLock || false;
      if (isLocked) {
        console.log(`Chapter ${chapter.id} is locked. Retrying with session.`);
        const sessionCookie = 'sessionid=07b34d642ef635f351b8d3ec62b1f565';
        pageContent = await fetchPage(url, sessionCookie);
        initialState = extractInitialState(pageContent);
      }

      const rawHtmlContent = initialState?.reader?.chapterData?.content;
      if (!rawHtmlContent) {
        console.warn(`Could not extract HTML content for chapter ${chapter.id}.`);
        continue;
      }
      
      const paragraphs = parseChapterContent(rawHtmlContent);

      if (paragraphs.length > 0) {
        const paragraphData = paragraphs.map((p, index) => ({
          text: p,
          order: index + 1,
          chapterId: chapter.id,
        }));

        await prisma.$transaction([
          prisma.paragraph.createMany({
            data: paragraphData,
          }),
          prisma.chapter.update({
            where: { id: chapter.id },
            data: { downloaded: true },
          }),
        ]);

        console.log(`Successfully saved ${paragraphs.length} paragraphs for chapter ${chapter.id} and marked as downloaded.`);
      } else {
        console.log(`Extracted content was empty for chapter ${chapter.id}.`);
      }
    } catch (error) {
      console.error(
        `An error occurred while fetching content for chapter ${chapter.id}:`,
        error
      );
    }

    processedCount++;
    const progress = Math.floor(
      (processedCount / chaptersToFetch.length) * 100
    );
    await job.updateProgress(progress);
  }

  console.log(`Finished fetching content for book ${bookId}.`);
} 