import { Job } from 'bullmq';
import { PrismaClient } from '@/app/generated/prisma';
import type { FetchBookContentData, FetchSingleChapterContentData } from '../worker';
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

async function fetchChapterContent(
  chapter: { id: string; fanqie_chapter_id: string | null },
  prisma: PrismaClient,
) {
  if (!chapter.fanqie_chapter_id) {
    console.warn(`Chapter ${chapter.id} has no fanqie_chapter_id.`);
    return;
  }

  const url = `https://fanqienovel.com/reader/${chapter.fanqie_chapter_id}`;
  console.log(`Fetching content for chapter ${chapter.id} from ${url}`);

  try {
    let pageContent = await fetchPage(url);
    let initialState = extractInitialState(pageContent);

    if (!initialState) {
      console.warn(`Could not extract initial state for chapter ${chapter.id}.`);
      return;
    }

    const isLocked =
      initialState?.reader?.chapterData?.isChapterLock || false;
    if (isLocked) {
      console.log(`Chapter ${chapter.id} is locked. Retrying with session.`);
      const sessionCookie = process.env.FANQIE_SESSION_ID
        ? `sessionid=${process.env.FANQIE_SESSION_ID}`
        : undefined;
      if (!sessionCookie) {
        console.warn(
          "FANQIE_SESSION_ID not set. Cannot fetch locked chapter.",
        );
        return;
      }
      pageContent = await fetchPage(url, sessionCookie);
      initialState = extractInitialState(pageContent);
    }

    const rawHtmlContent = initialState?.reader?.chapterData?.content;
    if (!rawHtmlContent) {
      console.warn(`Could not extract HTML content for chapter ${chapter.id}.`);
      return;
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
          data: { status: "UNANALYZED" },
        }),
      ]);

      console.log(
        `Successfully saved ${paragraphs.length} paragraphs for chapter ${chapter.id} and marked as UNANALYZED.`,
      );
    } else {
      console.log(`Extracted content was empty for chapter ${chapter.id}.`);
    }
  } catch (error) {
    console.error(
      `An error occurred while fetching content for chapter ${chapter.id}:`,
      error,
    );
  }
}

export async function handleFetchBookContent(job: Job<FetchBookContentData>, prisma: PrismaClient) {
  console.log(`Fetching content for book ${job.data.bookId}`);

  const chaptersToFetch = await prisma.chapter.findMany({
    where: {
      status: "EMPTY",
      ...(job.data.bookId && { bookId: job.data.bookId }),
    },
    take: 10,
  });

  if (chaptersToFetch.length === 0) {
    console.log(`No chapters to fetch for book ${job.data.bookId}`);
    await job.updateProgress(100);
    return;
  }

  console.log(`Found ${chaptersToFetch.length} chapters to fetch content for.`);
  let processedCount = 0;

  for (const chapter of chaptersToFetch) {
    await fetchChapterContent(chapter, prisma);
    processedCount++;
    const progress = Math.floor(
      (processedCount / chaptersToFetch.length) * 100,
    );
    await job.updateProgress(progress);
  }

  console.log(`Finished fetching content for book ${job.data.bookId}.`);
}

export async function handleFetchSingleChapterContent(
  job: Job<FetchSingleChapterContentData>,
  prisma: PrismaClient,
) {
  console.log(`Fetching content for single chapter ${job.data.chapterId}`);

  const chapter = await prisma.chapter.findUnique({
    where: { id: job.data.chapterId },
  });

  if (!chapter) {
    console.error(`Chapter with id ${job.data.chapterId} not found.`);
    throw new Error(`Chapter with id ${job.data.chapterId} not found.`);
  }

  await fetchChapterContent(chapter, prisma);
  console.log(`Finished fetching content for single chapter ${job.data.chapterId}.`);
} 