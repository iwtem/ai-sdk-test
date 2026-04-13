"use client";

import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { FileActionsMenu } from "../document-file-actions";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "../document-file-type";
import { DocumentHeader } from "../document-header";
import type { FileSortField } from "../documents-url";
import { formatBytes, formatDateTime, statusTextMap } from "../format";
import { useDocumentsPage } from "../use-documents-page";

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

  const handleSortBy = (field: FileSortField) => {
    if (url.sortBy === field) {
      url.updateUrl({ sortOrder: url.sortOrder === "asc" ? "desc" : "asc" });
      return;
    }
    url.updateUrl({ sortBy: field, sortOrder: field === "name" ? "asc" : "desc" });
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

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="w-[38%]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSortBy("name")}
                    disabled={loading}
                  >
                    文件名
                    {url.sortBy === "name" ? (
                      url.sortOrder === "asc" ? (
                        <ArrowUp data-icon="inline-end" />
                      ) : (
                        <ArrowDown data-icon="inline-end" />
                      )
                    ) : (
                      <ArrowUpDown data-icon="inline-end" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[16%]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSortBy("size")}
                    disabled={loading}
                  >
                    大小
                    {url.sortBy === "size" ? (
                      url.sortOrder === "asc" ? (
                        <ArrowUp data-icon="inline-end" />
                      ) : (
                        <ArrowDown data-icon="inline-end" />
                      )
                    ) : (
                      <ArrowUpDown data-icon="inline-end" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[22%]">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => handleSortBy("updatedAt")}
                    disabled={loading}
                  >
                    更新时间
                    {url.sortBy === "updatedAt" ? (
                      url.sortOrder === "asc" ? (
                        <ArrowUp data-icon="inline-end" />
                      ) : (
                        <ArrowDown data-icon="inline-end" />
                      )
                    ) : (
                      <ArrowUpDown data-icon="inline-end" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[16%]">上传人</TableHead>
                <TableHead className="w-[8%] text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const visualType = normalizeType(file.ext, file.mimeType);
                return (
                  <TableRow key={file.id} className="text-sm transition-colors hover:bg-muted/40">
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-muted-foreground">
                          <FileTypeIcon type={visualType} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            <Link href={`/documents/${file.id}`} className="hover:underline">
                              {file.name}
                            </Link>
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {fileVisualTypeLabels[visualType]} · {statusTextMap[file.status]}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatBytes(file.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(file.updatedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{file.owner || "未知"}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <FileActionsMenu
                          trashView={url.trashView}
                          file={file}
                          currentFolderId={url.folderId}
                          breadcrumb={breadcrumb}
                          subfolders={subfolders}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="border-border border-t px-3 py-2 text-muted-foreground text-xs">
            当前按 {sortLabelMap[url.sortBy]} {url.sortOrder === "asc" ? "升序" : "降序"} 排序
          </div>
        </div>

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
      </div>
    </section>
  );
}
