"use client";

import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  Folder,
  Grid2x2,
  List,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { DataTable, type DataTableColumn } from "~/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";

import { FileActionsMenu } from "./document-file-actions";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "./document-file-type";
import { FolderActionsMenu } from "./document-folder-actions";
import { DocumentHeader } from "./document-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
import type { FileSortField } from "./documents-url";
import { formatBytes, formatDateTime, statusTextMap } from "./format";
import type { BrowserRow } from "./types";
import { useFolderMutations } from "./use-document-mutations";
import { useDocumentsPage } from "./use-documents-page";

export default function DocumentsPage() {
  const {
    url,
    keywordDraft,
    setKeywordDraft,
    filesQuery,
    files,
    stats,
    foldersQuery,
    breadcrumbQuery,
    uploading,
    uploadTasks,
    uploadFiles,
    handleSelectFile,
    retryTask,
  } = useDocumentsPage();

  const { createFolder } = useFolderMutations();

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderError, setCreateFolderError] = useState<string | null>(null);

  const filesError = filesQuery.error
    ? filesQuery.error instanceof Error
      ? filesQuery.error.message
      : "加载失败"
    : null;

  const subfolders = foldersQuery.data ?? [];
  const breadcrumb = breadcrumbQuery.data ?? [];
  const foldersLoading = foldersQuery.isLoading;

  const sortedSubfolders = useMemo(() => {
    const list = [...subfolders];
    const mult = url.sortOrder === "asc" ? 1 : -1;
    if (url.sortBy === "name") {
      list.sort((a, b) => mult * a.name.localeCompare(b.name, "zh-CN"));
    } else if (url.sortBy === "updatedAt") {
      list.sort(
        (a, b) => mult * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()),
      );
    } else if (url.sortBy === "createdAt") {
      list.sort(
        (a, b) => mult * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    }
    return list;
  }, [subfolders, url.sortBy, url.sortOrder]);

  const visibleSubfolders = useMemo(() => {
    const q = url.q.trim().toLowerCase();
    if (!q) return sortedSubfolders;
    return sortedSubfolders.filter((f) => f.name.toLowerCase().includes(q));
  }, [sortedSubfolders, url.q]);

  const handleCreateFolder = () => {
    setCreateFolderError(null);
    createFolder.mutate(
      { parentId: url.folderId, name: newFolderName },
      {
        onSuccess: () => {
          setNewFolderName("");
          setCreateFolderOpen(false);
        },
        onError: (err) => setCreateFolderError(err instanceof Error ? err.message : "创建失败"),
      },
    );
  };

  const handleSearch = () => {
    url.updateUrl({ q: keywordDraft.trim() });
  };

  const sortLabelMap: Record<FileSortField, string> = {
    name: "文件名",
    size: "大小",
    updatedAt: "更新时间",
    createdAt: "创建时间",
  };

  const loading = filesQuery.isLoading;

  const rows = useMemo<BrowserRow[]>(
    () => [
      ...visibleSubfolders.map((f) => ({ type: "folder" as const, data: f })),
      ...files.map((f) => ({ type: "file" as const, data: f })),
    ],
    [visibleSubfolders, files],
  );

  const listColumns = useMemo<DataTableColumn<BrowserRow>[]>(
    () => [
      {
        key: "name",
        title: "文件名",
        width: "38%",
        sortable: "name",
        defaultSortOrder: "asc",
        render: (row) => {
          if (row.type === "folder") {
            return (
              <button
                type="button"
                className="flex min-w-0 items-center gap-2.5 text-left"
                onClick={() => url.updateUrl({ folderId: row.data.id, trashView: false })}
              >
                <Folder className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.data.name}</p>
                  <p className="truncate text-muted-foreground text-xs">文件夹</p>
                </div>
              </button>
            );
          }
          const vt = normalizeType(row.data.ext, row.data.mimeType);
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-muted-foreground">
                <FileTypeIcon type={vt} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <Link href={`/documents/${row.data.id}`} className="hover:underline">
                    {row.data.name}
                  </Link>
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {fileVisualTypeLabels[vt]} · {statusTextMap[row.data.status]}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: "size",
        title: "大小",
        width: "16%",
        sortable: "size",
        defaultSortOrder: "desc",
        render: (row) => (
          <span className="text-muted-foreground">
            {row.type === "folder" ? "—" : formatBytes(row.data.sizeBytes)}
          </span>
        ),
      },
      {
        key: "updatedAt",
        title: "更新时间",
        width: "22%",
        sortable: "updatedAt",
        defaultSortOrder: "desc",
        render: (row) => (
          <span className="text-muted-foreground">{formatDateTime(row.data.updatedAt)}</span>
        ),
      },
      {
        key: "owner",
        title: "上传人",
        width: "16%",
        render: (row) => (
          <span className="text-muted-foreground">
            {row.type === "folder" ? "—" : row.data.owner || "未知"}
          </span>
        ),
      },
      {
        key: "actions",
        title: "操作",
        width: "8%",
        align: "center",
        render: (row) => (
          <div className="flex justify-center">
            {row.type === "folder" ? (
              <FolderActionsMenu
                folder={row.data}
                currentFolderId={url.folderId}
                breadcrumb={breadcrumb}
                subfolders={subfolders}
              />
            ) : (
              <FileActionsMenu
                trashView={url.trashView}
                file={row.data}
                currentFolderId={url.folderId}
                breadcrumb={breadcrumb}
                subfolders={subfolders}
              />
            )}
          </div>
        ),
      },
    ],
    [url, breadcrumb, subfolders],
  );

  return (
    <DocumentUploadZone uploading={uploading} onFiles={uploadFiles}>
      <section className="space-y-6">
        <DocumentHeader
          title="文档中心"
          description="上传、管理并快速定位团队文档（数据来自接口）。"
          extra={
            <>
              <Button variant="outline" asChild>
                <Link href="/documents/trash" scroll={false}>
                  <Trash2 />
                  回收站
                </Link>
              </Button>
              <Button onClick={handleSelectFile} disabled={uploading}>
                <UploadCloud />
                {uploading ? "上传中..." : "上传文档"}
              </Button>
            </>
          }
        />

        <DocumentStats
          totalCount={stats.totalCount}
          totalSize={stats.totalSize}
          weeklyUploaded={stats.weeklyUploaded}
        />

        <DocumentUploadTasks tasks={uploadTasks} uploading={uploading} onRetry={retryTask} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1 border-border border-b pb-3 text-sm">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground"
              onClick={() => url.updateUrl({ folderId: null, trashView: false })}
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
                  onClick={() => url.updateUrl({ folderId: crumb.id, trashView: false })}
                >
                  {crumb.name}
                </Button>
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索文件名，按 Enter 搜索"
                  className="pl-8"
                  value={keywordDraft}
                  onChange={(e) => setKeywordDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setCreateFolderOpen(true)}
              >
                新建文件夹
              </Button>
              <ToggleGroup
                type="single"
                value={url.viewMode}
                onValueChange={(v) => {
                  if (v === "card" || v === "list") url.updateUrl({ viewMode: v });
                }}
                variant="outline"
                size="sm"
                spacing={0}
                className="shrink-0 rounded-lg border border-border"
                aria-label="视图布局"
              >
                <ToggleGroupItem value="card" aria-label="卡片视图">
                  <Grid2x2 className="size-4" />
                  卡片
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="列表视图">
                  <List className="size-4" />
                  列表
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {filesError ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
              <AlertCircle className="size-4" />
              {filesError}
            </div>
          ) : null}

          {!loading && !foldersLoading && files.length === 0 && visibleSubfolders.length === 0 ? (
            <div className="rounded-xl border border-border bg-background px-4 py-12 text-center text-muted-foreground text-sm">
              {!url.q.trim()
                ? "当前目录下暂无文件与子文件夹，可上传文档或新建文件夹。"
                : "没有匹配的文件或子文件夹，可调整关键词或清空搜索。"}
            </div>
          ) : null}

          {url.viewMode === "card" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleSubfolders.map((folder) => (
                <article
                  key={`folder-${folder.id}`}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
                      onClick={() => url.updateUrl({ folderId: folder.id, trashView: false })}
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
                      currentFolderId={url.folderId}
                      breadcrumb={breadcrumb}
                      subfolders={subfolders}
                    />
                  </div>
                </article>
              ))}
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
                          trashView={url.trashView}
                          file={file}
                          currentFolderId={url.folderId}
                          breadcrumb={breadcrumb}
                          subfolders={subfolders}
                        />
                      </div>
                    </div>

                    <h3 className="mb-2 line-clamp-1 font-medium">
                      <Link href={`/documents/${file.id}`} className="hover:underline">
                        {file.name}
                      </Link>
                    </h3>

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
            <DataTable
              columns={listColumns}
              data={rows}
              rowKey={(row) => (row.type === "folder" ? `folder-${row.data.id}` : row.data.id)}
              sortBy={url.sortBy}
              sortOrder={url.sortOrder}
              onSortChange={(field, order) =>
                url.updateUrl({ sortBy: field as FileSortField, sortOrder: order })
              }
              loading={loading}
              footer={`当前按 ${sortLabelMap[url.sortBy]} ${url.sortOrder === "asc" ? "升序" : "降序"} 排序`}
            />
          )}

          {(filesQuery.hasNextPage ?? false) ? (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filesQuery.isFetchingNextPage}
                onClick={() => void filesQuery.fetchNextPage()}
              >
                {filesQuery.isFetchingNextPage ? "加载中…" : "加载更多"}
              </Button>
            </div>
          ) : null}

          <Dialog
            open={createFolderOpen}
            onOpenChange={setCreateFolderOpen}
            key={url.folderId ?? "root"}
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
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
              {createFolderError ? (
                <p className="text-destructive text-sm">{createFolderError}</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateFolderOpen(false)}>
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateFolder}
                  disabled={createFolder.isPending}
                >
                  {createFolder.isPending ? "创建中…" : "创建"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </DocumentUploadZone>
  );
}
