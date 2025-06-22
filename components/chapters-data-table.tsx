"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconDownload,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Chapter, chapterSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"

async function getChapters(bookId?: string): Promise<Chapter[]> {
  const url = bookId ? `/api/chapters?bookId=${bookId}` : "/api/chapters"
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  const data = await response.json()
  return z.array(chapterSchema).parse(data)
}

async function downloadChapter(chapterId: string) {
  const response = await fetch(`/api/chapters/${chapterId}/download`, {
    method: "POST",
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to schedule download task")
  }

  return response.json()
}

type DownloadFunction = (chapterId: string) => void

const getColumns = (
  downloadChapter: DownloadFunction,
  isPending: boolean,
  pendingChapterId?: string,
): ColumnDef<Chapter>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorFn: (row) => row.book?.title,
    id: "bookTitle",
    header: "书名",
  },
  {
    accessorFn: (row) => row.volume?.title,
    id: "volume",
    header: "分卷名",
  },
  {
    accessorKey: "title",
    header: "章节名",
    cell: ({ row }) => {
      return (
        <Link
          href={`/chapters/${row.original.id}`}
          className="hover:underline"
        >
          {row.original.title}
        </Link>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "addedAt",
    header: "入库时间",
    cell: ({ row }) => {
      const date = new Date(row.getValue("addedAt"))
      return date.toLocaleDateString("zh-CN")
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.original.status
      if (status === "EMPTY") {
        const isLoading = isPending && pendingChapterId === row.original.id
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadChapter(row.original.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <IconLoader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <IconDownload className="mr-2 h-4 w-4" />
            )}
            EMPTY
          </Button>
        )
      }

      const variant =
        status === "ANALYZED"
          ? "default"
          : status === "UNANALYZED"
          ? "secondary"
          : "outline"
      return (
        <Badge
          variant={variant}
          className={cn(status === "ANALYZED" && "bg-green-600 text-white")}
        >
          {status}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">打开菜单</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>制作副本</DropdownMenuItem>
          <DropdownMenuItem>收藏</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">删除</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function ChaptersDataTable({ bookId }: { bookId?: string }) {
  const queryClient = useQueryClient()

  const downloadMutation = useMutation<unknown, Error, string>({
    mutationFn: downloadChapter,
    onSuccess: () => {
      toast.success("章节下载任务已加入队列。")
      queryClient.invalidateQueries({ queryKey: ["chapters", bookId] })
    },
    onError: (error) => {
      toast.error(`任务创建失败: ${error.message}`)
    },
  })

  const columns = React.useMemo(
    () =>
      getColumns(
        downloadMutation.mutate,
        downloadMutation.isPending,
        downloadMutation.variables,
      ),
    [downloadMutation.isPending, downloadMutation.variables, downloadMutation.mutate],
  )

  const { data = [], isLoading } = useQuery({
    queryKey: ["chapters", bookId],
    queryFn: () => getChapters(bookId),
  })
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const { analyzedCount, unanalyzedCount, totalCount } = React.useMemo(() => {
    const analyzed = data.filter((c) => c.status === "ANALYZED").length
    const unanalyzed = data.filter(
      (c) => c.status === "UNANALYZED" || c.status === "EMPTY",
    ).length
    const total = data.length
    return {
      analyzedCount: analyzed,
      unanalyzedCount: unanalyzed,
      totalCount: total,
    }
  }, [data])

  const [activeTab, setActiveTab] = React.useState("all-chapters")

  const filteredData = React.useMemo(() => {
    if (activeTab === "analyzed") {
      return data.filter((item) => item.status === "ANALYZED")
    }
    if (activeTab === "unanalyzed") {
      return data.filter(
        (item) => item.status === "UNANALYZED" || item.status === "EMPTY",
      )
    }
    return data
  }, [data, activeTab])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const tableContent = (
    <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center">
                    <IconLoader className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  无结果。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          已选择 {table.getFilteredSelectedRowModel().rows.length} 行，共{" "}
          {table.getFilteredRowModel().rows.length} 行。
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              每页行数
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            第 {table.getState().pagination.pageIndex + 1} 页，共{" "}
            {table.getPageCount()} 页
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">跳转至首页</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">上一页</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">下一页</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">跳转至末页</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          视图
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="选择一个视图" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-chapters">所有章节 ({totalCount})</SelectItem>
            <SelectItem value="unanalyzed">
              未分析 ({unanalyzedCount})
            </SelectItem>
            <SelectItem value="analyzed">已分析 ({analyzedCount})</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all-chapters">
            所有章节 <Badge variant="secondary">{totalCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unanalyzed">
            未分析 <Badge variant="secondary">{unanalyzedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="analyzed">
            已分析 <Badge variant="secondary">{analyzedCount}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">自定义列</span>
                <span className="lg:hidden">列</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {
                        {
                          bookTitle: "书名",
                          volume: "分卷名",
                          addedAt: "入库时间",
                          status: "状态",
                        }[column.id]
                      }
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">添加章节</span>
          </Button>
        </div>
      </div>
      <TabsContent value="all-chapters">{tableContent}</TabsContent>
      <TabsContent value="unanalyzed">{tableContent}</TabsContent>
      <TabsContent value="analyzed">{tableContent}</TabsContent>
    </Tabs>
  )
}
