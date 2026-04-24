"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, MoreVertical, Search } from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "../document-file-type";
import { DocumentHeader } from "../document-header";
import { formatBytes, formatDateTime, statusTextMap } from "../format";
import type { FileItem } from "../types";
import { useFileMutations } from "../use-document-mutations";

function mapFileItems(
  items: Array<{
    id: string;
    name: string;
    ext: string;
    mimeType: string;
    sizeBytes: number;
    updatedAt: string;
    createdBy: string | null;
    folderId: string | null;
    status: FileItem["status"];
  }>,
): FileItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    ext: item.ext || "",
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes,
    updatedAt: item.updatedAt,
    owner: item.createdBy,
    status: item.status,
    folderId: item.folderId ?? null,
  }));
}

async function fetchTrashFilesPage(params: { q: string; offset: number }) {
  const sp = new URLSearchParams();
  sp.set("trash", "true");
  if (params.q.trim()) sp.set("q", params.q.trim());
  sp.set("limit", "50");
  sp.set("offset", String(params.offset));

  const res = await fetch(`/api/files?${sp.toString()}`);
  if (!res.ok) throw new Error(`请求失败：${res.status}`);

  const data = (await res.json()) as {
    items: Parameters<typeof mapFileItems>[0];
    page: { hasMore: boolean };
  };

  return { items: mapFileItems(data.items), page: data.page };
}

function TrashFileActionsMenu({ file }: { file: FileItem }) {
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

export default function DocumentsTrashPage() {
  const [query, setQuery] = useQueryState("q", { defaultValue: "" });

  const filesQuery = useInfiniteQuery({
    queryKey: ["files", { q: query, trash: true }],
    queryFn: ({ pageParam = 0 }) => fetchTrashFilesPage({ q: query, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.page.hasMore) return undefined;
      return allPages.reduce((sum, p) => sum + p.items.length, 0);
    },
  });

  const files = useMemo(
    () => filesQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [filesQuery.data],
  );

  const filesError = filesQuery.error
    ? filesQuery.error instanceof Error
      ? filesQuery.error.message
      : "加载失败"
    : null;

  const loading = filesQuery.isLoading;

  const columns = useMemo<DataTableColumn<FileItem>[]>(
    () => [
      {
        key: "name",
        title: "文件名",
        width: "38%",
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
        render: (file) => (
          <span className="text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
        ),
      },
      {
        key: "updatedAt",
        title: "更新时间",
        width: "22%",
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
            <TrashFileActionsMenu file={file} />
          </div>
        ),
      },
    ],
    [],
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
        <div className="relative w-48">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索已删除文件名"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filesError ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
            <AlertCircle className="size-4" />
            {filesError}
          </div>
        ) : null}

        <DataTable columns={columns} data={files} loading={loading} />

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
