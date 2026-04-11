"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, FolderOpen, HardDrive } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DOCUMENT_UPLOAD_REJECT_MESSAGE,
  isDocumentUploadAllowed,
} from "~/lib/files/document-upload-allowed";
import {
  buildDocumentsHref,
  type DocumentsUrlState,
  parseDocumentsLocation,
} from "./documents-url";
import { formatBytes } from "./format";
import type { FileItem, FolderListItem, UploadTask, ViewMode } from "./types";

export type { FileSortField, FileSortOrder } from "./documents-url";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

const documentsKeys = {
  files: (params: {
    q: string;
    folderId: string | null;
    trash: boolean;
    sort: string;
    order: string;
  }) => ["files", params] as const,
  folders: (parentId: string | null) => ["folders", parentId] as const,
  breadcrumb: (folderId: string | null) => ["breadcrumb", folderId] as const,
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

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

type FilesPage = {
  items: FileItem[];
  stats: { totalCount: number; totalSize: number; weeklyUploaded: number };
  page: { hasMore: boolean };
};

async function fetchFilesPage(params: {
  q: string;
  folderId: string | null;
  trash: boolean;
  sort: string;
  order: string;
  offset: number;
}): Promise<FilesPage> {
  const sp = new URLSearchParams();
  if (params.trash) {
    sp.set("trash", "true");
    if (params.q.trim()) sp.set("q", params.q.trim());
  } else {
    if (params.q.trim()) sp.set("q", params.q.trim());
    if (params.folderId) sp.set("folderId", params.folderId);
  }
  sp.set("limit", "50");
  sp.set("offset", String(params.offset));
  sp.set("sort", params.sort);
  sp.set("order", params.order);

  const res = await fetch(`/api/files?${sp.toString()}`);
  if (!res.ok) throw new Error(`请求失败：${res.status}`);

  const data = (await res.json()) as {
    items: Parameters<typeof mapFileItems>[0];
    stats: FilesPage["stats"];
    page: { hasMore: boolean };
  };

  return { items: mapFileItems(data.items), stats: data.stats, page: data.page };
}

async function fetchFolders(parentId: string | null): Promise<FolderListItem[]> {
  const sp = new URLSearchParams();
  if (parentId) sp.set("parentId", parentId);
  const res = await fetch(`/api/folders?${sp.toString()}`);
  if (!res.ok) throw new Error(`加载文件夹失败：${res.status}`);
  const data = (await res.json()) as { items: FolderListItem[] };
  return data.items;
}

async function fetchBreadcrumb(
  folderId: string | null,
): Promise<Array<{ id: string; name: string }>> {
  if (!folderId) return [];
  const res = await fetch(`/api/folders/${folderId}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { breadcrumb: Array<{ id: string; name: string }> };
  return data.breadcrumb;
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function useParsedDocumentsUrl(pathname: string) {
  const searchParams = useSearchParams();
  return useMemo(
    () => parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString())),
    [pathname, searchParams],
  );
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useDocumentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = useParsedDocumentsUrl(pathname);

  const currentFolderId = parsed.folderId;
  const trashView = parsed.trashView;
  const sortBy = parsed.sortBy;
  const sortOrder = parsed.sortOrder;
  const viewMode = parsed.viewMode;

  const [keywordDraft, setKeywordDraft] = useState(parsed.q);
  useEffect(() => {
    setKeywordDraft(parsed.q);
  }, [parsed.q]);

  const commitUrl = useCallback(
    (next: DocumentsUrlState) => {
      router.replace(buildDocumentsHref(next), { scroll: false });
    },
    [router],
  );

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      const prev = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, folderId, trashView: false });
    },
    [pathname, searchParams, commitUrl],
  );

  const setSortBy = useCallback(
    (sort: DocumentsUrlState["sortBy"]) => {
      const prev = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, sortBy: sort });
    },
    [pathname, searchParams, commitUrl],
  );

  const setSortOrder = useCallback(
    (order: DocumentsUrlState["sortOrder"]) => {
      const prev = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, sortOrder: order });
    },
    [pathname, searchParams, commitUrl],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      const prev = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, viewMode: mode });
    },
    [pathname, searchParams, commitUrl],
  );

  const applySearchToUrl = useCallback(() => {
    const prev = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
    commitUrl({ ...prev, q: keywordDraft.trim() });
  }, [pathname, searchParams, commitUrl, keywordDraft]);

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const filesQueryParams = useMemo(
    () => ({
      q: parsed.q,
      folderId: currentFolderId,
      trash: trashView,
      sort: sortBy,
      order: sortOrder,
    }),
    [parsed.q, currentFolderId, trashView, sortBy, sortOrder],
  );

  const {
    data: filesData,
    isLoading: filesLoading,
    isFetchingNextPage: loadingMore,
    hasNextPage: hasMoreFiles,
    fetchNextPage,
    error: filesError,
  } = useInfiniteQuery({
    queryKey: documentsKeys.files(filesQueryParams),
    queryFn: ({ pageParam = 0 }) =>
      fetchFilesPage({ ...filesQueryParams, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.page.hasMore) return undefined;
      const total = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return total;
    },
  });

  const files = useMemo(
    () => filesData?.pages.flatMap((p) => p.items) ?? [],
    [filesData],
  );

  const stats = useMemo(
    () =>
      filesData?.pages.at(-1)?.stats ?? {
        totalCount: 0,
        totalSize: 0,
        weeklyUploaded: 0,
      },
    [filesData],
  );

  const { data: subfolders = [], isLoading: foldersLoading } = useQuery({
    queryKey: documentsKeys.folders(currentFolderId),
    queryFn: () => fetchFolders(currentFolderId),
    enabled: !trashView,
  });

  const { data: breadcrumb = [] } = useQuery({
    queryKey: documentsKeys.breadcrumb(currentFolderId),
    queryFn: () => fetchBreadcrumb(currentFolderId),
    enabled: !!currentFolderId && !trashView,
  });

  const loading = filesLoading;
  const queryError = filesError
    ? filesError instanceof Error
      ? filesError.message
      : "加载失败"
    : null;

  // -------------------------------------------------------------------------
  // Upload state (kept as-is – not suitable for react-query)
  // -------------------------------------------------------------------------

  const [uploading, setUploading] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const folderIdRef = useRef<string | null>(null);
  folderIdRef.current = currentFolderId;

  const invalidateAll = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["files"] }),
        queryClient.invalidateQueries({ queryKey: ["folders"] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb"] }),
      ]),
    [queryClient],
  );

  const updateTask = useCallback((taskId: string, patch: Partial<UploadTask>) => {
    setUploadTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    );
  }, []);

  const putFileToSignedUrl = useCallback(
    (taskId: string, uploadUrl: string, file: File, contentType: string) =>
      new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
            updateTask(taskId, { progress, status: "uploading" });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateTask(taskId, { progress: 100 });
            resolve();
            return;
          }
          reject(new Error(`上传文件失败：${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("上传文件失败：网络错误"));
        xhr.send(file);
      }),
    [updateTask],
  );

  const processSingleFile = useCallback(
    async (taskId: string, file: File) => {
      const folderId = folderIdRef.current;
      try {
        if (!isDocumentUploadAllowed(file.name, file.type || "application/octet-stream")) {
          updateTask(taskId, {
            status: "error",
            message: DOCUMENT_UPLOAD_REJECT_MESSAGE,
          });
          throw new Error(DOCUMENT_UPLOAD_REJECT_MESSAGE);
        }

        updateTask(taskId, { status: "uploading", progress: 0, message: undefined });
        const signResponse = await fetch("/api/files/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            ...(folderId ? { folderId } : {}),
          }),
        });
        if (!signResponse.ok) {
          const errBody = (await signResponse.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(errBody?.message || `获取上传地址失败：${signResponse.status}`);
        }
        const signData = (await signResponse.json()) as { uploadUrl: string; key: string };
        const contentType = file.type || "application/octet-stream";

        await putFileToSignedUrl(taskId, signData.uploadUrl, file, contentType);

        const completeResponse = await fetch("/api/files/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            mimeType: contentType,
            sizeBytes: file.size,
            storageKey: signData.key,
            createdBy: "当前用户",
            ...(folderId ? { folderId } : {}),
          }),
        });
        if (!completeResponse.ok) {
          const errBody = (await completeResponse.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(errBody?.message || `入库失败：${completeResponse.status}`);
        }

        updateTask(taskId, { status: "success", message: "上传成功" });
      } catch (err) {
        updateTask(taskId, {
          status: "error",
          message: err instanceof Error ? err.message : "上传失败",
        });
        throw err;
      }
    },
    [putFileToSignedUrl, updateTask],
  );

  const uploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      const allowed = selectedFiles.filter((file) =>
        isDocumentUploadAllowed(file.name, file.type || "application/octet-stream"),
      );
      const skipped = selectedFiles.length - allowed.length;
      if (allowed.length === 0) {
        toast.error(
          skipped > 0
            ? `${DOCUMENT_UPLOAD_REJECT_MESSAGE}（共 ${skipped} 个文件）`
            : DOCUMENT_UPLOAD_REJECT_MESSAGE,
        );
        return;
      }

      setUploading(true);

      const tasks = allowed.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setUploadTasks((prev) => [...tasks, ...prev].slice(0, 20));

      const results = await Promise.allSettled(
        tasks.map((task) => processSingleFile(task.id, task.file)),
      );
      const successCount = results.filter((item) => item.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `上传完成：成功 ${successCount} 个${failCount ? `，失败 ${failCount} 个` : ""}${
            skipped > 0 ? `；已跳过 ${skipped} 个非文档` : ""
          }`,
        );
      } else if (failCount > 0) {
        toast.error("上传失败，请重试。");
      }

      await invalidateAll();
      setUploading(false);
    },
    [processSingleFile, invalidateAll],
  );

  const handleSelectFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.onchange = () => {
      const selected = Array.from(input.files ?? []);
      if (selected.length > 0) void uploadFiles(selected);
    };
    input.click();
  }, [uploadFiles]);

  const retryTask = useCallback(
    async (task: UploadTask) => {
      updateTask(task.id, { status: "pending", progress: 0, message: undefined });
      setUploading(true);
      try {
        await processSingleFile(task.id, task.file);
        await invalidateAll();
      } catch {
        // error is tracked on task
      } finally {
        setUploading(false);
      }
    },
    [processSingleFile, updateTask, invalidateAll],
  );

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const statItems = useMemo(
    () => [
      {
        label: trashView ? "回收站文件" : "文件总数",
        value: `${stats.totalCount}`,
        icon: FolderOpen,
      },
      { label: "已用空间", value: formatBytes(stats.totalSize), icon: HardDrive },
      {
        label: trashView ? "近 7 日删除" : "本周上传",
        value: `${stats.weeklyUploaded}`,
        icon: FileUp,
      },
    ],
    [stats, trashView],
  );

  const loadMoreFiles = useCallback(() => {
    if (hasMoreFiles && !loadingMore) void fetchNextPage();
  }, [hasMoreFiles, loadingMore, fetchNextPage]);

  const fetchFiles = useCallback(() => {
    applySearchToUrl();
  }, [applySearchToUrl]);

  const trashEntryHref = useMemo(() => {
    const p = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
    return buildDocumentsHref({ ...p, trashView: true, folderId: null, q: "" });
  }, [pathname, searchParams]);

  const documentsBrowseHref = useMemo(() => {
    const p = parseDocumentsLocation(pathname, new URLSearchParams(searchParams.toString()));
    if (!p.trashView) return buildDocumentsHref(p);
    return buildDocumentsHref({ ...p, trashView: false });
  }, [pathname, searchParams]);

  return {
    viewMode,
    setViewMode,
    trashView,
    trashEntryHref,
    documentsBrowseHref,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    hasMoreFiles: hasMoreFiles ?? false,
    loadingMore,
    loadMoreFiles,
    currentFolderId,
    navigateToFolder,
    breadcrumb,
    subfolders,
    foldersLoading,
    keyword: keywordDraft,
    setKeyword: setKeywordDraft,
    appliedQuery: parsed.q,
    files,
    loading,
    error: queryError,
    uploading,
    uploadTasks,
    uploadFiles,
    fetchFiles,
    handleSelectFile,
    retryTask,
    statItems,
  };
}
