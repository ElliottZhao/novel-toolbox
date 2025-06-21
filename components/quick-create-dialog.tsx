"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconLoader } from "@tabler/icons-react"

async function createBook(bookData: { fanqie_book_id: string }) {
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

export function QuickCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [fanqieBookId, setFanqieBookId] = useState("")
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      toast.success("书籍添加成功！")
      queryClient.invalidateQueries({ queryKey: ["books"] })
      onOpenChange(false)
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
    mutate({ fanqie_book_id: fanqieBookId })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>快速创建</DialogTitle>
          <DialogDescription>
            输入书籍的番茄ID，即可快速创建一本新书。
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
              placeholder="请输入番茄ID"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending && <IconLoader className="mr-2 h-4 w-4 animate-spin" />}
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 