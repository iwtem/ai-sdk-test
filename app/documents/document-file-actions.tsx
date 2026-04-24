"use client";

import { Copy, Download, Eye, MoreVertical, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { FileItem, FolderListItem } from "./types";
import { useFileMutations } from "./use-document-mutations";

export function FileActionsMenu({
  file,
  currentFolderId,
  breadcrumb,
  subfolders,
}: {
  file: FileItem;
  currentFolderId: string | null;
  breadcrumb: Array<{ id: string; name: string }>;
  subfolders: FolderListItem[];
}) {
  const { moveFile, renameFile, deleteFile, fetchDownloadUrl } = useFileMutations();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);

  const parentFolderId =
    breadcrumb.length >= 2 ? (breadcrumb[breadcrumb.length - 2]?.id ?? null) : null;
  const inSubfolder = (file.folderId ?? null) !== null;
  const hasMoveTargets = inSubfolder || currentFolderId !== null || subfolders.length > 0;
  const showMoveSep = (inSubfolder || currentFolderId !== null) && subfolders.length > 0;

  const busy =
    (moveFile.isPending && moveFile.variables?.fileId === file.id) ||
    (deleteFile.isPending && deleteFile.variables === file.id) ||
    renameFile.isPending;

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
            aria-label="文件操作"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() =>
              void fetchDownloadUrl(file.id).then((url) => {
                window.open(url, "_blank", "noopener,noreferrer");
              })
            }
          >
            <Download className="size-4" />
            下载
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/documents/${file.id}`}>
              <Eye className="size-4" />
              查看详情
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              void fetchDownloadUrl(file.id).then((url) => {
                void navigator.clipboard.writeText(url).then(() => {
                  toast.success("下载链接已复制（短期内有效）");
                });
              })
            }
          >
            <Copy className="size-4" />
            复制下载链接
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setRenameValue(file.name);
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" />
            重命名
          </DropdownMenuItem>
          {hasMoveTargets ? <DropdownMenuSeparator /> : null}
          {hasMoveTargets ? (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>移动到…</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {inSubfolder ? (
                  <DropdownMenuItem
                    onClick={() => moveFile.mutate({ fileId: file.id, targetFolderId: null })}
                  >
                    根目录
                  </DropdownMenuItem>
                ) : null}
                {currentFolderId !== null ? (
                  <DropdownMenuItem
                    onClick={() =>
                      moveFile.mutate({ fileId: file.id, targetFolderId: parentFolderId })
                    }
                  >
                    上级目录
                  </DropdownMenuItem>
                ) : null}
                {showMoveSep ? <DropdownMenuSeparator /> : null}
                {subfolders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => moveFile.mutate({ fileId: file.id, targetFolderId: folder.id })}
                  >
                    <span className="truncate">{folder.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmDeleteOpen(true)}>
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>重命名文件</DialogTitle>
            <DialogDescription>修改展示名称（扩展名会随文件名更新）。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameFile.mutate(
                  { fileId: file.id, name: renameValue },
                  { onSuccess: () => setRenameOpen(false) },
                );
              }
            }}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={renameFile.isPending}
              onClick={() =>
                renameFile.mutate(
                  { fileId: file.id, name: renameValue },
                  { onSuccess: () => setRenameOpen(false) },
                )
              }
            >
              {renameFile.isPending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>删除文件</DialogTitle>
            <DialogDescription>
              确定删除「{file.name}」？删除后列表中将不再显示（软删除，可在回收站恢复）。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteFile.isPending}
              onClick={() =>
                deleteFile.mutate(file.id, {
                  onSuccess: () => setConfirmDeleteOpen(false),
                })
              }
            >
              {deleteFile.isPending ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
