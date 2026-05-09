import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { parseApiJson } from "~/lib/api/parse-json";

// ---------------------------------------------------------------------------
// Shared API helper
// ---------------------------------------------------------------------------

async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const res = await fetch(url, init);
  const raw = await res.json().catch(() => ({}));
  return parseApiJson<T>(res, raw);
}

// ---------------------------------------------------------------------------
// File mutations
// ---------------------------------------------------------------------------

export function useFileMutations() {
  const queryClient = useQueryClient();

  const invalidateFiles = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["files"] }),
    [queryClient],
  );

  const moveFile = useMutation({
    mutationFn: async ({
      fileId,
      targetFolderId,
    }: {
      fileId: string;
      targetFolderId: string | null;
    }) => {
      const result = await apiFetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: targetFolderId }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSettled: () => void invalidateFiles(),
  });

  const renameFile = useMutation({
    mutationFn: async ({ fileId, name }: { fileId: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("文件名不能为空");
      const result = await apiFetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFiles(),
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await apiFetch(`/api/files/${fileId}`, { method: "DELETE" });
      if (!result.ok) throw new Error(result.message);
    },
    onSettled: () => void invalidateFiles(),
  });

  const restoreFile = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await apiFetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restore: true }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFiles(),
  });

  const purgeFile = useMutation({
    mutationFn: async (fileId: string) => {
      const result = await apiFetch(`/api/files/${fileId}/purge`, { method: "POST" });
      if (!result.ok) throw new Error(result.message);
    },
    onSettled: () => void invalidateFiles(),
  });

  const fetchDownloadUrl = useCallback(async (fileId: string) => {
    const res = await fetch(`/api/files/${fileId}/download-url`);
    const raw = await res.json().catch(() => ({}));
    const parsed = parseApiJson<{ downloadUrl?: string }>(res, raw);
    if (!parsed.ok) throw new Error(parsed.message);
    if (!parsed.data.downloadUrl) throw new Error("无下载地址");
    return parsed.data.downloadUrl;
  }, []);

  return { moveFile, renameFile, deleteFile, restoreFile, purgeFile, fetchDownloadUrl };
}

// ---------------------------------------------------------------------------
// Folder mutations
// ---------------------------------------------------------------------------

export function useFolderMutations() {
  const queryClient = useQueryClient();

  const invalidateFolders = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["folders"] }),
        queryClient.invalidateQueries({ queryKey: ["breadcrumb"] }),
      ]),
    [queryClient],
  );

  const createFolder = useMutation({
    mutationFn: async ({ parentId, name }: { parentId: string | null; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("名称不能为空");
      const result = await apiFetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, name: trimmed }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFolders(),
  });

  const renameFolder = useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("名称不能为空");
      const result = await apiFetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFolders(),
  });

  const moveFolder = useMutation({
    mutationFn: async ({
      folderId,
      newParentId,
    }: {
      folderId: string;
      newParentId: string | null;
    }) => {
      const result = await apiFetch(`/api/folders/${folderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: newParentId }),
      });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFolders(),
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const result = await apiFetch(`/api/folders/${folderId}`, { method: "DELETE" });
      if (!result.ok) throw new Error(result.message);
    },
    onSuccess: () => void invalidateFolders(),
  });

  return { createFolder, renameFolder, moveFolder, deleteFolder };
}
