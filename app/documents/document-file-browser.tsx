"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Folder,
  Grid2x2,
  List,
  MoreVertical,
  Pencil,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "./document-file-type";
import { FolderActionsMenu } from "./document-folder-actions";
import { formatBytes, formatDateTime, statusTextMap } from "./format";
import type { FileItem, FolderListItem, ViewMode } from "./types";
import type { FileSortField, FileSortOrder } from "./use-documents-page";

function FileActionsMenu({
  trashView,
  file,
  currentFolderId,
  breadcrumb,
  subfolders,
  movingFileId,
  deletingFileId,
  purgingFileId,
  onMoveFile,
  onDeleteFile,
  onRenameFile,
  onRestore,
  onPurge,
  fetchDownloadUrl,
  flashNotice,
}: {
  trashView: boolean;
  file: FileItem;
  currentFolderId: string | null;
  breadcrumb: Array<{ id: string; name: string }>;
  subfolders: FolderListItem[];
  movingFileId: string | null;
  deletingFileId: string | null;
  purgingFileId: string | null;
  onMoveFile: (fileId: string, folderId: string | null) => void | Promise<void>;
  onDeleteFile: (fileId: string) => Promise<boolean>;
  onRenameFile: (fileId: string, name: string) => Promise<boolean>;
  onRestore: (fileId: string) => Promise<boolean>;
  onPurge: (fileId: string) => Promise<boolean>;
  fetchDownloadUrl: (fileId: string) => Promise<string>;
  flashNotice: (msg: string) => void;
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const [renaming, setRenaming] = useState(false);

  const parentFolderId =
    breadcrumb.length >= 2 ? (breadcrumb[breadcrumb.length - 2]?.id ?? null) : null;
  const inSubfolder = (file.folderId ?? null) !== null;
  const hasMoveTargets =
    !trashView && (inSubfolder || currentFolderId !== null || subfolders.length > 0);
  const showMoveSep = (inSubfolder || currentFolderId !== null) && subfolders.length > 0;

  const busy =
    movingFileId === file.id || deletingFileId === file.id || purgingFileId === file.id || renaming;
  const deleting = deletingFileId === file.id;
  const purging = purgingFileId === file.id;

  if (trashView) {
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
            <DropdownMenuItem onClick={() => void onRestore(file.id)}>恢复</DropdownMenuItem>
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
            <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmPurgeOpen(false)}>
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={purging}
                onClick={() =>
                  void onPurge(file.id).then((ok) => {
                    if (ok) setConfirmPurgeOpen(false);
                  })
                }
              >
                {purging ? "删除中…" : "彻底删除"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

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
          <DropdownMenuItem
            onClick={() =>
              void fetchDownloadUrl(file.id).then((url) => {
                void navigator.clipboard.writeText(url).then(() => {
                  flashNotice("下载链接已复制（短期内有效）");
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
                  <DropdownMenuItem onClick={() => void onMoveFile(file.id, null)}>
                    根目录
                  </DropdownMenuItem>
                ) : null}
                {currentFolderId !== null ? (
                  <DropdownMenuItem onClick={() => void onMoveFile(file.id, parentFolderId)}>
                    上级目录
                  </DropdownMenuItem>
                ) : null}
                {showMoveSep ? <DropdownMenuSeparator /> : null}
                {subfolders.map((folder) => (
                  <DropdownMenuItem
                    key={folder.id}
                    onClick={() => void onMoveFile(file.id, folder.id)}
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
                setRenaming(true);
                void onRenameFile(file.id, renameValue).then((ok) => {
                  setRenaming(false);
                  if (ok) setRenameOpen(false);
                });
              }
            }}
          />
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              disabled={renaming}
              onClick={() => {
                setRenaming(true);
                void onRenameFile(file.id, renameValue).then((ok) => {
                  setRenaming(false);
                  if (ok) setRenameOpen(false);
                });
              }}
            >
              {renaming ? "保存中…" : "保存"}
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
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() =>
                void onDeleteFile(file.id).then((ok) => {
                  if (ok) setConfirmDeleteOpen(false);
                })
              }
            >
              {deleting ? "删除中…" : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type DocumentFileBrowserProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  trashView: boolean;
  sortBy: FileSortField;
  sortOrder: FileSortOrder;
  onSortByChange: (v: FileSortField) => void;
  onSortOrderChange: (v: FileSortOrder) => void;
  hasMoreFiles: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  keyword: string;
  /** 已提交到 URL 的搜索词，用于与文件列表对齐并过滤子文件夹 */
  appliedQuery: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  error: string | null;
  uploadMessage: string | null;
  files: FileItem[];
  foldersLoading: boolean;
  currentFolderId: string | null;
  breadcrumb: Array<{ id: string; name: string }>;
  subfolders: FolderListItem[];
  onMoveFile: (fileId: string, folderId: string | null) => void | Promise<void>;
  movingFileId: string | null;
  onDeleteFile: (fileId: string) => Promise<boolean>;
  deletingFileId: string | null;
  onRenameFile: (fileId: string, name: string) => Promise<boolean>;
  onRestoreFile: (fileId: string) => Promise<boolean>;
  onPurgeFile: (fileId: string) => Promise<boolean>;
  purgingFileId: string | null;
  fetchDownloadUrl: (fileId: string) => Promise<string>;
  flashNotice: (msg: string) => void;
  onNavigateToFolder: (folderId: string | null) => void;
  onRenameFolder: (folderId: string, name: string) => Promise<{ ok: boolean; message?: string }>;
  onMoveFolder: (
    folderId: string,
    newParentId: string | null,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDeleteFolder: (folderId: string) => Promise<boolean>;
  onCreateFolder: (name: string) => Promise<{ ok: boolean; message?: string }>;
};

export function DocumentFileBrowser({
  viewMode,
  onViewModeChange,
  trashView,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  hasMoreFiles,
  loadingMore,
  onLoadMore,
  keyword,
  appliedQuery,
  onKeywordChange,
  onSearch,
  loading,
  error,
  uploadMessage,
  files,
  foldersLoading,
  currentFolderId,
  breadcrumb,
  subfolders,
  onMoveFile,
  movingFileId,
  onDeleteFile,
  deletingFileId,
  onRenameFile,
  onRestoreFile,
  onPurgeFile,
  purgingFileId,
  fetchDownloadUrl,
  flashNotice,
  onNavigateToFolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onCreateFolder,
}: DocumentFileBrowserProps) {
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  const sortedSubfolders = useMemo(() => {
    if (trashView) return [];
    const list = [...subfolders];
    const mult = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
      list.sort((a, b) => mult * a.name.localeCompare(b.name, "zh-CN"));
    } else if (sortBy === "updatedAt") {
      list.sort(
        (a, b) => mult * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
      );
    } else if (sortBy === "createdAt") {
      list.sort(
        (a, b) => mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    }
    return list;
  }, [subfolders, sortBy, sortOrder, trashView]);

  const visibleSubfolders = useMemo(() => {
    if (trashView) return [];
    const q = appliedQuery.trim().toLowerCase();
    if (!q) return sortedSubfolders;
    return sortedSubfolders.filter((f) => f.name.toLowerCase().includes(q));
  }, [sortedSubfolders, appliedQuery, trashView]);

  const handleCreateFolder = async () => {
    setCreatingFolder(true);
    setCreateFolderError(null);
    const result = await onCreateFolder(newFolderName);
    setCreatingFolder(false);
    if (result.ok) {
      setNewFolderName("");
      setCreateFolderOpen(false);
    } else {
      setCreateFolderError(result.message ?? "创建失败");
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      {!trashView ? (
        <div className="flex flex-wrap items-center gap-1 border-border border-b pb-3 text-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={() => onNavigateToFolder(null)}
          >
            根目录
          </Button>
          {breadcrumb.map((crumb, index) => (
            <span key={crumb.id} className="inline-flex items-center gap-1">
              <ChevronRight className="size-4 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${index === breadcrumb.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}
                onClick={() => onNavigateToFolder(crumb.id)}
              >
                {crumb.name}
              </Button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                trashView ? "搜索已删除文件名，按 Enter 搜索" : "搜索文件名，按 Enter 搜索"
              }
              className="pl-8"
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSearch();
                }
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sortBy}
              onValueChange={(v) => onSortByChange(v as FileSortField)}
              disabled={loading}
            >
              <SelectTrigger size="sm" className="w-[132px]">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">创建时间</SelectItem>
                <SelectItem value="updatedAt">更新时间</SelectItem>
                <SelectItem value="name">文件名</SelectItem>
                <SelectItem value="size">大小</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}
              disabled={loading}
            >
              {sortOrder === "asc" ? "升序" : "降序"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
          {!trashView ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setCreateFolderOpen(true)}
            >
              新建文件夹
            </Button>
          ) : null}
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("card")}
          >
            <Grid2x2 className="size-4" />
            卡片
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onViewModeChange("list")}
          >
            <List className="size-4" />
            列表
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <AlertCircle className="size-4" />
          {error}
        </div>
      ) : null}

      {!trashView && uploadMessage ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
          {uploadMessage}
        </div>
      ) : null}

      {!loading &&
      !foldersLoading &&
      files.length === 0 &&
      (trashView || visibleSubfolders.length === 0) ? (
        <div className="rounded-xl border border-border bg-background px-4 py-12 text-center text-muted-foreground text-sm">
          {trashView
            ? !appliedQuery.trim()
              ? "回收站为空。"
              : "未找到匹配的已删除文件。"
            : !appliedQuery.trim()
              ? "当前目录下暂无文件与子文件夹，可上传文档或新建文件夹。"
              : "没有匹配的文件或子文件夹，可调整关键词或清空搜索。"}
        </div>
      ) : null}

      {viewMode === "card" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {!trashView
            ? visibleSubfolders.map((folder) => (
                <article
                  key={`folder-${folder.id}`}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
                      onClick={() => onNavigateToFolder(folder.id)}
                    >
                      <div className="inline-flex items-center gap-2 text-muted-foreground">
                        <Folder className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span className="font-medium text-xs">文件夹</span>
                      </div>
                      <h3 className="line-clamp-1 font-medium text-foreground">{folder.name}</h3>
                      <Badge variant="secondary">目录</Badge>
                      <div className="text-muted-foreground text-xs">
                        <p className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" />
                          更新于 {formatDateTime(folder.updatedAt)}
                        </p>
                      </div>
                    </button>
                    <FolderActionsMenu
                      folder={folder}
                      currentFolderId={currentFolderId}
                      breadcrumb={breadcrumb}
                      subfolders={subfolders}
                      onRenameFolder={onRenameFolder}
                      onMoveFolder={onMoveFolder}
                      onDeleteFolder={onDeleteFolder}
                    />
                  </div>
                </article>
              ))
            : null}
          {files.map((file) => {
            const visualType = normalizeType(file.ext, file.mimeType);
            const extDisplay = (file.ext || "—").toUpperCase();
            return (
              <article
                key={file.id}
                className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-muted-foreground">
                    <FileTypeIcon type={visualType} />
                    <span className="font-medium text-xs">
                      {fileVisualTypeLabels[visualType]} · {extDisplay}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Badge variant="outline">{formatBytes(file.sizeBytes)}</Badge>
                    <FileActionsMenu
                      trashView={trashView}
                      file={file}
                      currentFolderId={currentFolderId}
                      breadcrumb={breadcrumb}
                      subfolders={subfolders}
                      movingFileId={movingFileId}
                      deletingFileId={deletingFileId}
                      purgingFileId={purgingFileId}
                      onMoveFile={onMoveFile}
                      onDeleteFile={onDeleteFile}
                      onRenameFile={onRenameFile}
                      onRestore={onRestoreFile}
                      onPurge={onPurgeFile}
                      fetchDownloadUrl={fetchDownloadUrl}
                      flashNotice={flashNotice}
                    />
                  </div>
                </div>

                <h3 className="mb-2 line-clamp-1 font-medium">{file.name}</h3>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{statusTextMap[file.status]}</Badge>
                </div>

                <div className="space-y-1.5 text-muted-foreground text-xs">
                  <p className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    更新于 {formatDateTime(file.updatedAt)}
                  </p>
                  <p>上传人：{file.owner || "未知"}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr_auto] items-center bg-muted/60 px-4 py-2 text-muted-foreground text-xs">
            <span>文件名</span>
            <span>大小</span>
            <span>更新时间</span>
            <span>上传人</span>
            <span className="text-center">操作</span>
          </div>

          <div className="divide-y divide-border">
            {!trashView
              ? visibleSubfolders.map((folder) => (
                  <div
                    key={`folder-${folder.id}`}
                    className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr_auto] items-center px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2.5 text-left"
                      onClick={() => onNavigateToFolder(folder.id)}
                    >
                      <Folder className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{folder.name}</p>
                        <p className="truncate text-muted-foreground text-xs">文件夹</p>
                      </div>
                    </button>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">
                      {formatDateTime(folder.updatedAt)}
                    </span>
                    <span className="text-muted-foreground">—</span>
                    <div className="flex justify-center">
                      <FolderActionsMenu
                        folder={folder}
                        currentFolderId={currentFolderId}
                        breadcrumb={breadcrumb}
                        subfolders={subfolders}
                        onRenameFolder={onRenameFolder}
                        onMoveFolder={onMoveFolder}
                        onDeleteFolder={onDeleteFolder}
                      />
                    </div>
                  </div>
                ))
              : null}
            {files.map((file) => {
              const visualType = normalizeType(file.ext, file.mimeType);
              return (
                <div
                  key={file.id}
                  className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr_auto] items-center px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="text-muted-foreground">
                      <FileTypeIcon type={visualType} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{file.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {fileVisualTypeLabels[visualType]} · {statusTextMap[file.status]}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
                  <span className="text-muted-foreground">{formatDateTime(file.updatedAt)}</span>
                  <span className="text-muted-foreground">{file.owner || "未知"}</span>
                  <div className="flex justify-center">
                    <FileActionsMenu
                      trashView={trashView}
                      file={file}
                      currentFolderId={currentFolderId}
                      breadcrumb={breadcrumb}
                      subfolders={subfolders}
                      movingFileId={movingFileId}
                      deletingFileId={deletingFileId}
                      purgingFileId={purgingFileId}
                      onMoveFile={onMoveFile}
                      onDeleteFile={onDeleteFile}
                      onRenameFile={onRenameFile}
                      onRestore={onRestoreFile}
                      onPurge={onPurgeFile}
                      fetchDownloadUrl={fetchDownloadUrl}
                      flashNotice={flashNotice}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasMoreFiles ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "加载中…" : "加载更多"}
          </Button>
        </div>
      ) : null}

      <Dialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        key={currentFolderId ?? "root"}
      >
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>将在当前目录下创建文件夹。</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreateFolder();
            }}
          />
          {createFolderError ? (
            <p className="text-destructive text-sm">{createFolderError}</p>
          ) : null}
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setCreateFolderOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateFolder()}
              disabled={creatingFolder}
            >
              {creatingFolder ? "创建中…" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
