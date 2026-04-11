"use client";

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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import type { FolderListItem } from "./types";

export function FolderActionsMenu({
  folder,
  currentFolderId,
  breadcrumb,
  subfolders,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
}: {
  folder: FolderListItem;
  currentFolderId: string | null;
  breadcrumb: Array<{ id: string; name: string }>;
  subfolders: FolderListItem[];
  onRenameFolder: (folderId: string, name: string) => Promise<{ ok: boolean; message?: string }>;
  onMoveFolder: (
    folderId: string,
    newParentId: string | null,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
}) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const parentOfCurrent =
    breadcrumb.length >= 2 ? (breadcrumb[breadcrumb.length - 2]?.id ?? null) : null;
  const showMoveSep =
    (currentFolderId !== null || folder.parentId !== null) &&
    subfolders.filter((s) => s.id !== folder.id).length > 0;

  const handleRename = async () => {
    setRenaming(true);
    setRenameError(null);
    const result = await onRenameFolder(folder.id, renameValue);
    setRenaming(false);
    if (result.ok) {
      setRenameOpen(false);
    } else {
      setRenameError(result.message ?? "重命名失败");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground"
            aria-label="文件夹操作"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setRenameValue(folder.name);
              setRenameOpen(true);
            }}
          >
            重命名
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>移动到…</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  void onMoveFolder(folder.id, null);
                }}
              >
                根目录
              </DropdownMenuItem>
              {currentFolderId !== null ? (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void onMoveFolder(folder.id, parentOfCurrent);
                  }}
                >
                  上级目录
                </DropdownMenuItem>
              ) : null}
              {showMoveSep ? <DropdownMenuSeparator /> : null}
              {subfolders
                .filter((s) => s.id !== folder.id)
                .map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void onMoveFolder(folder.id, s.id);
                    }}
                  >
                    <span className="truncate">{s.name}</span>
                  </DropdownMenuItem>
                ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent showCloseButton onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>重命名文件夹</DialogTitle>
            <DialogDescription>修改「{folder.name}」的显示名称。</DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRename();
            }}
          />
          {renameError ? <p className="text-destructive text-sm">{renameError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={() => void handleRename()} disabled={renaming}>
              {renaming ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent showCloseButton onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>删除文件夹</DialogTitle>
            <DialogDescription>
              确定删除「{folder.name}」？仅当文件夹为空时可删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                setDeleting(true);
                void onDeleteFolder(folder.id).then((ok) => {
                  setDeleting(false);
                  if (ok) setDeleteOpen(false);
                });
              }}
            >
              {deleting ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
