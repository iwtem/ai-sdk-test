export type ViewMode = "card" | "list";

export type UploadStatus = "pending" | "uploading" | "success" | "error";

export type FileItem = {
  id: string;
  name: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  owner: string | null;
  folderId?: string | null;
  status: "uploaded" | "indexing" | "ready" | "failed" | "deleted";
};

export type FolderListItem = {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type UploadTask = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  message?: string;
};
