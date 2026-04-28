"use client";

import type { File } from "@prisma/client";
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

import { useFileMutations } from "../use-document-mutations";

export function TrashFileActionsMenu({ file }: { file: File }) {
  const { restoreFile, purgeFile } = useFileMutations();
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);

  const busy =
    (restoreFile.isPending && restoreFile.variables === file.id) ||
    (purgeFile.isPending && purgeFile.variables === file.id);

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
          <DropdownMenuItem onClick={() => restoreFile.mutate(file.id)}>恢复</DropdownMenuItem>
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
              disabled={purgeFile.isPending}
              onClick={() =>
                purgeFile.mutate(file.id, {
                  onSuccess: () => setConfirmPurgeOpen(false),
                })
              }
            >
              {purgeFile.isPending ? "删除中…" : "彻底删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
