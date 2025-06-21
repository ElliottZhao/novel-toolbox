import { ChaptersDataTable } from "@/components/chapters-data-table"

export default async function ChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ bookId?: string }>
}) {
  const { bookId } = await searchParams

  return (
    <div className="flex w-full flex-col justify-start gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">章节列表</h1>
          <p className="text-muted-foreground">浏览和管理所有章节。</p>
        </div>
      </div>
      <ChaptersDataTable bookId={bookId ? Number(bookId) : undefined} />
    </div>
  )
} 