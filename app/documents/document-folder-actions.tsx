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
import { useFolderMutations } from "./use-document-mutations";

export function FolderActionsMenu({
  folder,
  currentFolderId,
  breadcrumb,
  subfolders,
}: {
  folder: FolderListItem;
  currentFolderId: string | null;
  breadcrumb: Array<{ id: string; name: string }>;
  subfolders: FolderListItem[];
}) {
  const { renameFolder, moveFolder, deleteFolder } = useFolderMutations();

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const parentOfCurrent =
    breadcrumb.length >= 2 ? (breadcrumb[breadcrumb.length - 2]?.id ?? null) : null;
  const showMoveSep =
    (currentFolderId !== null || folder.parentId !== null) &&
    subfolders.filter((s) => s.id !== folder.id).length > 0;

  const handleRename = () => {
    setRenameError(null);
    renameFolder.mutate(
      { folderId: folder.id, name: renameValue },
      {
        onSuccess: () => setRenameOpen(false),
        onError: (err) => setRenameError(err instanceof Error ? err.message : "重命名失败"),
      },
    );
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
                  moveFolder.mutate({ folderId: folder.id, newParentId: null });
                }}
              >
                根目录
              </DropdownMenuItem>
              {currentFolderId !== null ? (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    moveFolder.mutate({ folderId: folder.id, newParentId: parentOfCurrent });
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
                      moveFolder.mutate({ folderId: folder.id, newParentId: s.id });
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
              if (e.key === "Enter") handleRename();
            }}
          />
          {renameError ? <p className="text-destructive text-sm">{renameError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={handleRename}
              disabled={renameFolder.isPending}
            >
              {renameFolder.isPending ? "保存中…" : "保存"}
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
              disabled={deleteFolder.isPending}
              onClick={() =>
                deleteFolder.mutate(folder.id, {
                  onSuccess: () => setDeleteOpen(false),
                })
              }
            >
              {deleteFolder.isPending ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
