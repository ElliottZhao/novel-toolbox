"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Book } from "@/lib/schemas"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FETCH_CATALOG_TASK, FETCH_BOOK_CONTENT_TASK } from "@/lib/tasks"

export type BookWithStatus = Book & { status: string };

export const columns = (onAction: (bookId: string, taskType: string) => void): ColumnDef<Book>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          标题
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "author",
    header: "作者",
  },
  {
    accessorKey: "source",
    header: "来源",
  },
  {
    accessorKey: "status",
    header: "状态",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const book = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onAction(book.id.toString(), FETCH_CATALOG_TASK)}
            >
              获取目录
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAction(book.id.toString(), FETCH_BOOK_CONTENT_TASK)}
            >
              获取正文
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 