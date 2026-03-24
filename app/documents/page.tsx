"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FileArchive,
  FileAudio2,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  FileVideo2,
  FolderOpen,
  Grid2x2,
  HardDrive,
  List,
  Search,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type ViewMode = "card" | "list";

type FileItem = {
  id: string;
  name: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  owner: string | null;
  status: "uploaded" | "indexing" | "ready" | "failed" | "deleted";
};

function normalizeType(
  ext: string,
  mimeType: string,
): "doc" | "sheet" | "image" | "video" | "audio" | "archive" | "code" {
  const e = ext.toLowerCase();
  const m = mimeType.toLowerCase();
  if (["xlsx", "xls", "csv"].includes(e)) return "sheet";
  if (["zip", "rar", "7z", "tar", "gz"].includes(e)) return "archive";
  if (["ts", "tsx", "js", "jsx", "json", "md", "py", "java", "go"].includes(e)) {
    return "code";
  }
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  return "doc";
}

function FileTypeIcon({
  type,
}: {
  type: "doc" | "sheet" | "image" | "video" | "audio" | "archive" | "code";
}) {
  switch (type) {
    case "doc":
      return <FileText className="size-5" />;
    case "sheet":
      return <FileSpreadsheet className="size-5" />;
    case "image":
      return <FileImage className="size-5" />;
    case "video":
      return <FileVideo2 className="size-5" />;
    case "audio":
      return <FileAudio2 className="size-5" />;
    case "archive":
      return <FileArchive className="size-5" />;
    case "code":
      return <FileCode2 className="size-5" />;
    default:
      return <FileText className="size-5" />;
  }
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", { hour12: false });
};

const statusTextMap = {
  uploaded: "已上传",
  indexing: "索引中",
  ready: "就绪",
  failed: "失败",
  deleted: "已删除",
} as const;

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [keyword, setKeyword] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stats, setStats] = useState({
    totalCount: 0,
    totalSize: 0,
    weeklyUploaded: 0,
  });

  const fetchFiles = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(`/api/files?${params.toString()}`, {
        method: "GET",
      });
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
          status: "uploaded" | "indexing" | "ready" | "failed" | "deleted";
        }>;
        stats: {
          totalCount: number;
          totalSize: number;
          weeklyUploaded: number;
        };
      };

      setFiles(
        data.items.map((item) => ({
          id: item.id,
          name: item.name,
          ext: item.ext || "",
          mimeType: item.mimeType,
          sizeBytes: item.sizeBytes,
          updatedAt: item.updatedAt,
          owner: item.createdBy,
          status: item.status,
        })),
      );
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setUploadMessage(null);
      try {
        const signResponse = await fetch("/api/files/upload-url", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
          }),
        });
        if (!signResponse.ok) {
          throw new Error(`获取上传地址失败：${signResponse.status}`);
        }
        const signData = (await signResponse.json()) as {
          uploadUrl: string;
          key: string;
        };

        const uploadResponse = await fetch(signData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`上传文件失败：${uploadResponse.status}`);
        }

        const completeResponse = await fetch("/api/files/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            storageKey: signData.key,
            createdBy: "当前用户",
          }),
        });
        if (!completeResponse.ok) {
          throw new Error(`入库失败：${completeResponse.status}`);
        }

        setUploadMessage(`上传成功：${file.name}`);
        await fetchFiles(keyword);
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
      }
    },
    [fetchFiles, keyword],
  );

  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0];
      if (!selected) return;
      await uploadFile(selected);
      event.target.value = "";
    },
    [uploadFile],
  );

  useEffect(() => {
    fetchFiles("");
  }, [fetchFiles]);

  const statItems = useMemo(
    () => [
      { label: "文件总数", value: `${stats.totalCount}`, icon: <FolderOpen className="size-4" /> },
      {
        label: "已用空间",
        value: formatBytes(stats.totalSize),
        icon: <HardDrive className="size-4" />,
      },
      { label: "本周上传", value: `${stats.weeklyUploaded}`, icon: <FileUp className="size-4" /> },
    ],
    [stats],
  );

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">File Center</p>
            <h1 className="font-semibold text-3xl tracking-tight">文件中心</h1>
            <p className="text-muted-foreground text-sm">
              上传、管理并快速定位团队文件（数据来自接口）。
            </p>
          </div>

          <Button className="w-full sm:w-auto" onClick={handleSelectFile} disabled={uploading}>
            <UploadCloud className="size-4" />
            {uploading ? "上传中..." : "上传文件"}
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {statItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="mb-2 inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                {item.icon}
                {item.label}
              </div>
              <div className="font-semibold text-2xl">{item.value}</div>
            </div>
          ))}
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange} />

        <div className="rounded-2xl border border-border/90 border-dashed bg-muted/30 p-5 sm:p-7">
          <div className="flex flex-col items-start gap-3">
            <div className="rounded-xl bg-background p-2 text-muted-foreground">
              <UploadCloud className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-medium text-base">拖拽文件到这里，或点击选择文件</h2>
              <p className="text-muted-foreground text-sm">
                支持 PDF / DOCX / XLSX / PNG / MP4 等格式，单文件上限 100MB
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={handleSelectFile} disabled={uploading}>
                {uploading ? "上传中..." : "选择文件"}
              </Button>
              <Button variant="ghost">新建文件夹</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名"
                className="pl-8"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchFiles(keyword);
                  }
                }}
              />
            </div>

            <div className="inline-flex items-center gap-2 self-end md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchFiles(keyword)}
                disabled={loading}
              >
                <Search className="size-4" />
                {loading ? "加载中" : "搜索"}
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
              >
                <Grid2x2 className="size-4" />
                卡片
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
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

          {uploadMessage ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              {uploadMessage}
            </div>
          ) : null}

          {!loading && files.length === 0 ? (
            <div className="rounded-xl border border-border bg-background px-4 py-12 text-center text-muted-foreground text-sm">
              暂无文件数据，请先上传文件并调用完成入库接口。
            </div>
          ) : null}

          {viewMode === "card" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => (
                <article
                  key={file.id}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <FileTypeIcon type={normalizeType(file.ext, file.mimeType)} />
                      <span className="font-medium text-xs">{file.ext || "UNKNOWN"}</span>
                    </div>
                    <Badge variant="outline">{formatBytes(file.sizeBytes)}</Badge>
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
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr] items-center bg-muted/60 px-4 py-2 text-muted-foreground text-xs">
                <span>文件名</span>
                <span>大小</span>
                <span>更新时间</span>
                <span>上传人</span>
              </div>

              <div className="divide-y divide-border">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr] items-center px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-muted-foreground">
                        <FileTypeIcon type={normalizeType(file.ext, file.mimeType)} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="truncate text-muted-foreground text-xs">
                          {statusTextMap[file.status]}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground">{formatBytes(file.sizeBytes)}</span>
                    <span className="text-muted-foreground">{formatDateTime(file.updatedAt)}</span>
                    <span className="text-muted-foreground">{file.owner || "未知"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
