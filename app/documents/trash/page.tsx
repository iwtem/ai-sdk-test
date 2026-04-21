"use client";

import { AlertCircle, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { DataTable, type DataTableColumn } from "~/components/ui/data-table";
import { Input } from "~/components/ui/input";
import { FileActionsMenu } from "../document-file-actions";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "../document-file-type";
import { DocumentHeader } from "../document-header";
import type { FileSortField } from "../documents-url";
import { formatBytes, formatDateTime, statusTextMap } from "../format";
import type { FileItem } from "../types";
import { useDocumentsPage } from "../use-documents-page";

const sortLabelMap: Record<FileSortField, string> = {
  name: "文件名",
  size: "大小",
  updatedAt: "更新时间",
  createdAt: "创建时间",
};

export default function DocumentsTrashPage() {
  const { url, keywordDraft, setKeywordDraft, filesQuery, files, foldersQuery, breadcrumbQuery } =
    useDocumentsPage();

  const filesError = filesQuery.error
    ? filesQuery.error instanceof Error
      ? filesQuery.error.message
      : "加载失败"
    : null;

  const loading = filesQuery.isLoading;

  const breadcrumb = useMemo(() => breadcrumbQuery.data ?? [], [breadcrumbQuery.data]);
  const subfolders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);

  const handleSearch = () => {
    url.updateUrl({ q: keywordDraft.trim() });
  };

  const columns = useMemo<DataTableColumn<FileItem>[]>(
    () => [
      {
        key: "name",
        title: "文件名",
        width: "38%",
        sortable: "name",
        defaultSortOrder: "asc",
        render: (file) => {
          const vt = normalizeType(file.ext, file.mimeType);
          return (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-muted-foreground">
                <FileTypeIcon type={vt} />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  <Link href={`/documents/${file.id}`} className="hover:underline">
                    {file.name}
                  </Link>
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {fileVisualTypeLabels[vt]} · {statusTextMap[file.status]}
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
        render: (file) => (
          <span className="text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
        ),
      },
      {
        key: "updatedAt",
        title: "更新时间",
        width: "22%",
        sortable: "updatedAt",
        defaultSortOrder: "desc",
        render: (file) => (
          <span className="text-muted-foreground">{formatDateTime(file.updatedAt)}</span>
        ),
      },
      {
        key: "owner",
        title: "上传人",
        width: "16%",
        render: (file) => <span className="text-muted-foreground">{file.owner || "未知"}</span>,
      },
      {
        key: "actions",
        title: "操作",
        width: "8%",
        align: "center",
        render: (file) => (
          <div className="flex justify-center">
            <FileActionsMenu
              trashView={url.trashView}
              file={file}
              currentFolderId={url.folderId}
              breadcrumb={breadcrumb}
              subfolders={subfolders}
            />
          </div>
        ),
      },
    ],
    [url, breadcrumb, subfolders],
  );

  return (
    <section className="space-y-6">
      <DocumentHeader
        title="回收站"
        description="查看已删除的文档，可恢复至原位置或彻底删除（不可恢复）。"
        extra={
          <Button variant="outline" asChild>
            <Link href="/documents" scroll={false}>
              <ArrowLeft />
              返回文档中心
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索已删除文件名，按 Enter 搜索"
            className="pl-8"
            value={keywordDraft}
            onChange={(e) => setKeywordDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>

        {filesError ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
            <AlertCircle className="size-4" />
            {filesError}
          </div>
        ) : null}

        {!loading && files.length === 0 ? (
          <div className="rounded-xl border border-border bg-background px-4 py-12 text-center text-muted-foreground text-sm">
            回收站为空。
          </div>
        ) : null}

        <DataTable
          columns={columns}
          data={files}
          sortBy={url.sortBy}
          sortOrder={url.sortOrder}
          onSortChange={(field, order) =>
            url.updateUrl({ sortBy: field as FileSortField, sortOrder: order })
          }
          loading={loading}
          footer={`当前按 ${sortLabelMap[url.sortBy]} ${url.sortOrder === "asc" ? "升序" : "降序"} 排序`}
        />

        {filesQuery.hasNextPage ? (
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
      </div>
    </section>
  );
}
