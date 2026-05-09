"use client";

import type { File } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { purgeFile, restoreFile } from "~/lib/api";

export function TrashFileActionsMenu({ file }: { file: File }) {
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);

  const { mutate: restoreFileMutation, isPending: restoreFilePending } = useMutation({
    mutationFn: restoreFile,
  });

  const { mutate: purgeFileMutation, isPending: purgeFilePending } = useMutation({
    mutationFn: purgeFile,
  });

  const busy = Boolean(restoreFilePending || purgeFilePending);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            disabled={busy}
            aria-label="回收站操作"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => restoreFileMutation(file.id)}>恢复</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmPurgeOpen(true)}>
            彻底删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmPurgeOpen} onOpenChange={setConfirmPurgeOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>彻底删除</DialogTitle>
            <DialogDescription>
              「{file.name}」将从数据库与对象存储中永久删除，无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmPurgeOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={purgeFilePending}
              onClick={() =>
                purgeFileMutation(file.id, {
                  onSuccess: () => setConfirmPurgeOpen(false),
                })
              }
            >
              {purgeFilePending ? "删除中…" : "彻底删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
