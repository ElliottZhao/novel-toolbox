"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconPlus, IconLoader } from "@tabler/icons-react"

async function createBook(bookData: {
  title: string
  author: string
  fanqie_book_id?: string
}) {
  const response = await fetch("/api/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || "Failed to create book")
  }

  return response.json()
}

export function AddBookDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [fanqieBookId, setFanqieBookId] = useState("")
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      toast.success("书籍添加成功！")
      queryClient.invalidateQueries({ queryKey: ["books"] })
      setOpen(false)
      // Reset form
      setTitle("")
      setAuthor("")
      setFanqieBookId("")
    },
    onError: (error) => {
      toast.error(`添加失败: ${error.message}`)
    },
  })

  const handleSubmit = () => {
    if (!fanqieBookId) {
      toast.error("番茄ID不能为空")
      return
    }
    mutate({ title, author, fanqie_book_id: fanqieBookId })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <IconPlus />
          添加书籍
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加新书籍</DialogTitle>
          <DialogDescription>
            输入书籍的详细信息，点击确定保存。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fanqie_book_id" className="text-right">
              番茄ID
            </Label>
            <Input
              id="fanqie_book_id"
              value={fanqieBookId}
              onChange={(e) => setFanqieBookId(e.target.value)}
              className="col-span-3"
              placeholder="例如：7169842169431788551"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              书名 (可选)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="例如：圣墟"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="author" className="text-right">
              作者 (可选)
            </Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="col-span-3"
              placeholder="例如：辰东"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
