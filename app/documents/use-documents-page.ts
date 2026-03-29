"use client";

import { FileUp, FolderOpen, HardDrive } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DOCUMENT_UPLOAD_REJECT_MESSAGE,
  isDocumentUploadAllowed,
} from "~/lib/files/document-upload-allowed";
import {
  type DocumentsUrlState,
  parseDocumentsSearchParams,
  serializeDocumentsUrl,
} from "./documents-url";
import { formatBytes } from "./format";
import type { FileItem, FolderListItem, UploadTask, ViewMode } from "./types";

export type { FileSortField, FileSortOrder } from "./documents-url";

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

/** URL 解析随 Next `useSearchParams` 更新；浏览器后退/前进会触发重渲染并同步列表。 */
function useParsedDocumentsUrl() {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  return useMemo(() => parseDocumentsSearchParams(new URLSearchParams(key)), [key]);
}

export function useDocumentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parsed = useParsedDocumentsUrl();

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
      const qs = serializeDocumentsUrl(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, folderId, trashView: false });
    },
    [searchParams, commitUrl],
  );

  const setTrashViewMode = useCallback(
    (value: boolean) => {
      const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      if (value) {
        commitUrl({
          ...prev,
          trashView: true,
          folderId: null,
          q: "",
        });
      } else {
        commitUrl({ ...prev, trashView: false });
      }
    },
    [searchParams, commitUrl],
  );

  const setSortBy = useCallback(
    (sort: DocumentsUrlState["sortBy"]) => {
      const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, sortBy: sort });
    },
    [searchParams, commitUrl],
  );

  const setSortOrder = useCallback(
    (order: DocumentsUrlState["sortOrder"]) => {
      const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, sortOrder: order });
    },
    [searchParams, commitUrl],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      commitUrl({ ...prev, viewMode: mode });
    },
    [searchParams, commitUrl],
  );

  const applySearchToUrl = useCallback(() => {
    const prev = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
    commitUrl({ ...prev, q: keywordDraft.trim() });
  }, [searchParams, commitUrl, keywordDraft]);

  const [breadcrumb, setBreadcrumb] = useState<Array<{ id: string; name: string }>>([]);
  const [subfolders, setSubfolders] = useState<FolderListItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const filesRef = useRef<FileItem[]>([]);
  filesRef.current = files;
  const [hasMoreFiles, setHasMoreFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [purgingFileId, setPurgingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderIdRef = useRef<string | null>(null);
  folderIdRef.current = currentFolderId;

  const [stats, setStats] = useState({
    totalCount: 0,
    totalSize: 0,
    weeklyUploaded: 0,
  });

  const fetchFolders = useCallback(async (parentId: string | null) => {
    setFoldersLoading(true);
    try {
      const params = new URLSearchParams();
      if (parentId) params.set("parentId", parentId);
      const response = await fetch(`/api/folders?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`加载文件夹失败：${response.status}`);
      }
      const data = (await response.json()) as { items: FolderListItem[] };
      setSubfolders(data.items);
    } catch {
      setSubfolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const loadBreadcrumb = useCallback(async (folderId: string | null) => {
    if (!folderId) {
      setBreadcrumb([]);
      return;
    }
    const response = await fetch(`/api/folders/${folderId}`);
    if (!response.ok) {
      setBreadcrumb([]);
      return;
    }
    const data = (await response.json()) as {
      breadcrumb: Array<{ id: string; name: string }>;
    };
    setBreadcrumb(data.breadcrumb);
  }, []);

  const fetchFilesFromApi = useCallback(
    async (args: {
      append: boolean;
      query: string;
      folderId: string | null;
      trash: boolean;
      sort: DocumentsUrlState["sortBy"];
      order: DocumentsUrlState["sortOrder"];
    }) => {
      const params = new URLSearchParams();
      if (args.trash) {
        params.set("trash", "true");
      } else {
        if (args.query.trim()) params.set("q", args.query.trim());
        if (args.folderId) params.set("folderId", args.folderId);
      }
      params.set("limit", "50");
      params.set("offset", String(args.append ? filesRef.current.length : 0));
      params.set("sort", args.sort);
      params.set("order", args.order);

      const response = await fetch(`/api/files?${params.toString()}`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`);
      }

      const data = (await response.json()) as {
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
        }>;
        stats: {
          totalCount: number;
          totalSize: number;
          weeklyUploaded: number;
        };
        page: { hasMore: boolean };
      };

      const mapped = mapFileItems(data.items);
      if (args.append) {
        setFiles((prev) => [...prev, ...mapped]);
      } else {
        setFiles(mapped);
      }
      setStats(data.stats);
      setHasMoreFiles(data.page.hasMore);
    },
    [],
  );

  const refreshTrashList = useCallback(async () => {
    const p = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
    setLoading(true);
    setError(null);
    try {
      await fetchFilesFromApi({
        append: false,
        query: p.q,
        folderId: p.folderId,
        trash: true,
        sort: p.sortBy,
        order: p.sortOrder,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      setFiles([]);
      setHasMoreFiles(false);
    } finally {
      setLoading(false);
    }
  }, [fetchFilesFromApi, searchParams]);

  const refreshCurrentView = useCallback(
    async (query: string, folderId: string | null) => {
      const p = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      setError(null);
      setLoading(true);
      try {
        await Promise.all([
          fetchFilesFromApi({
            append: false,
            query,
            folderId,
            trash: false,
            sort: p.sortBy,
            order: p.sortOrder,
          }),
          fetchFolders(folderId),
          loadBreadcrumb(folderId),
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
        setFiles([]);
        setHasMoreFiles(false);
      } finally {
        setLoading(false);
      }
    },
    [fetchFilesFromApi, fetchFolders, loadBreadcrumb, searchParams],
  );

  const urlKey = searchParams.toString();

  useEffect(() => {
    const p = parseDocumentsSearchParams(new URLSearchParams(urlKey));
    if (!p.trashView) return;
    void refreshTrashList();
  }, [urlKey, refreshTrashList]);

  useEffect(() => {
    const p = parseDocumentsSearchParams(new URLSearchParams(urlKey));
    if (p.trashView) return;
    void refreshCurrentView(p.q, p.folderId);
  }, [urlKey, refreshCurrentView]);

  const createFolder = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false as const, message: "名称不能为空" };
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: currentFolderId,
          name: trimmed,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        return { ok: false as const, message: body.message || `创建失败：${response.status}` };
      }
      await fetchFolders(currentFolderId);
      return { ok: true as const };
    },
    [currentFolderId, fetchFolders],
  );

  const renameFolder = useCallback(
    async (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false as const, message: "名称不能为空" };
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        return { ok: false as const, message: body.message || `重命名失败：${res.status}` };
      }
      await fetchFolders(currentFolderId);
      if (currentFolderId) await loadBreadcrumb(currentFolderId);
      return { ok: true as const };
    },
    [currentFolderId, fetchFolders, loadBreadcrumb],
  );

  const moveFolder = useCallback(
    async (folderId: string, newParentId: string | null) => {
      setError(null);
      const res = await fetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        const msg = body.message || `移动失败：${res.status}`;
        setError(msg);
        return { ok: false as const, message: msg };
      }
      await fetchFolders(currentFolderId);
      return { ok: true as const };
    },
    [currentFolderId, fetchFolders],
  );

  const deleteFolder = useCallback(
    async (folderId: string): Promise<boolean> => {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(body.message || `删除文件夹失败：${res.status}`);
        return false;
      }
      await fetchFolders(currentFolderId);
      return true;
    },
    [currentFolderId, fetchFolders],
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
        setError(
          skipped > 0
            ? `${DOCUMENT_UPLOAD_REJECT_MESSAGE}（共 ${skipped} 个文件）`
            : DOCUMENT_UPLOAD_REJECT_MESSAGE,
        );
        return;
      }

      setUploading(true);
      setError(null);
      setUploadMessage(null);

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
        setUploadMessage(
          `上传完成：成功 ${successCount} 个${failCount ? `，失败 ${failCount} 个` : ""}${
            skipped > 0 ? `；已跳过 ${skipped} 个非文档` : ""
          }`,
        );
      } else if (failCount > 0) {
        setError("上传失败，请重试。");
      }

      const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      await refreshCurrentView(snap.q, snap.folderId);
      setUploading(false);
    },
    [processSingleFile, refreshCurrentView, searchParams],
  );

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      if (selected.length === 0) return;
      await uploadFiles(selected);
      event.target.value = "";
    },
    [uploadFiles],
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      setDragging(false);
      const selected = Array.from(event.dataTransfer.files ?? []);
      if (selected.length === 0) return;
      await uploadFiles(selected);
    },
    [uploadFiles],
  );

  const moveFile = useCallback(
    async (fileId: string, targetFolderId: string | null) => {
      setMovingFileId(fileId);
      setError(null);
      try {
        const res = await fetch(`/api/files/${fileId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: targetFolderId }),
        });
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(body.message || `移动失败：${res.status}`);
          return;
        }
        const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
        if (snap.trashView) await refreshTrashList();
        else await refreshCurrentView(snap.q, snap.folderId);
      } finally {
        setMovingFileId(null);
      }
    },
    [refreshTrashList, refreshCurrentView, searchParams],
  );

  const renameFile = useCallback(
    async (fileId: string, name: string): Promise<boolean> => {
      const trimmed = name.trim();
      if (!trimmed) {
        setError("文件名不能为空");
        return false;
      }
      setError(null);
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(body.message || `重命名失败：${res.status}`);
        return false;
      }
      const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
      await refreshCurrentView(snap.q, snap.folderId);
      return true;
    },
    [refreshCurrentView, searchParams],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      setDeletingFileId(fileId);
      setError(null);
      try {
        const res = await fetch(`/api/files/${fileId}`, { method: "DELETE" });
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(body.message || `删除失败：${res.status}`);
          return false;
        }
        const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
        if (snap.trashView) await refreshTrashList();
        else await refreshCurrentView(snap.q, snap.folderId);
        return true;
      } finally {
        setDeletingFileId(null);
      }
    },
    [refreshTrashList, refreshCurrentView, searchParams],
  );

  const restoreFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      setError(null);
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setError(body.message || `恢复失败：${res.status}`);
        return false;
      }
      await refreshTrashList();
      return true;
    },
    [refreshTrashList],
  );

  const purgeFile = useCallback(
    async (fileId: string): Promise<boolean> => {
      setPurgingFileId(fileId);
      setError(null);
      try {
        const res = await fetch(`/api/files/${fileId}/purge`, { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(body.message || `彻底删除失败：${res.status}`);
          return false;
        }
        await refreshTrashList();
        return true;
      } finally {
        setPurgingFileId(null);
      }
    },
    [refreshTrashList],
  );

  const fetchDownloadUrl = useCallback(async (fileId: string) => {
    const res = await fetch(`/api/files/${fileId}/download-url`);
    const body = (await res.json().catch(() => ({}))) as {
      message?: string;
      downloadUrl?: string;
    };
    if (!res.ok) {
      throw new Error(body.message || `获取下载链接失败：${res.status}`);
    }
    if (!body.downloadUrl) throw new Error("无下载地址");
    return body.downloadUrl;
  }, []);

  const flashNotice = useCallback((msg: string) => {
    setUploadMessage(msg);
  }, []);

  const loadMoreFiles = useCallback(async () => {
    if (!hasMoreFiles || loadingMore) return;
    const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
    setLoadingMore(true);
    setError(null);
    try {
      await fetchFilesFromApi({
        append: true,
        query: snap.q,
        folderId: snap.folderId,
        trash: snap.trashView,
        sort: snap.sortBy,
        order: snap.sortOrder,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreFiles, loadingMore, fetchFilesFromApi, searchParams]);

  const retryTask = useCallback(
    async (task: UploadTask) => {
      updateTask(task.id, { status: "pending", progress: 0, message: undefined });
      setUploading(true);
      try {
        await processSingleFile(task.id, task.file);
        const snap = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
        await refreshCurrentView(snap.q, snap.folderId);
      } catch {
        // error is tracked on task
      } finally {
        setUploading(false);
      }
    },
    [refreshCurrentView, processSingleFile, updateTask, searchParams],
  );

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

  const fetchFiles = useCallback(() => {
    const p = parseDocumentsSearchParams(new URLSearchParams(searchParams.toString()));
    if (p.trashView) {
      void refreshTrashList();
    } else {
      applySearchToUrl();
    }
  }, [searchParams, refreshTrashList, applySearchToUrl]);

  return {
    viewMode,
    setViewMode,
    trashView,
    setTrashViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    hasMoreFiles,
    loadingMore,
    loadMoreFiles,
    currentFolderId,
    navigateToFolder,
    breadcrumb,
    subfolders,
    foldersLoading,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    keyword: keywordDraft,
    setKeyword: setKeywordDraft,
    files,
    loading,
    error,
    uploadMessage,
    stats,
    uploading,
    dragging,
    setDragging,
    uploadTasks,
    fileInputRef,
    fetchFiles,
    handleSelectFile,
    handleFileInputChange,
    handleDrop,
    retryTask,
    statItems,
    moveFile,
    movingFileId,
    deleteFile,
    deletingFileId,
    renameFile,
    restoreFile,
    purgeFile,
    purgingFileId,
    fetchDownloadUrl,
    flashNotice,
  };
}
