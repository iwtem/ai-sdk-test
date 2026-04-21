import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { env } from "~/lib/env";

import type { statusTextMap } from "../format";

type PageProps = {
  params: Promise<{ id: string }>;
};

type FileDetail = {
  id: string;
  name: string;
  ext: string;
  mimeType: string;
  sizeBytes: number;
  status: keyof typeof statusTextMap;
  folderId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

const OFFICE_EXTENSIONS = new Set([
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "csv",
  "txt",
  "rtf",
  "odt",
  "ods",
  "odp",
  "pdf",
]);

function getDocumentType(ext: string) {
  const e = ext.toLowerCase();
  if (["xls", "xlsx", "csv", "ods"].includes(e)) return "cell";
  if (["ppt", "pptx", "odp"].includes(e)) return "slide";
  return "word";
}

async function fetchFileDetail(fileId: string): Promise<FileDetail> {
  const res = await fetch(`/api/files/${fileId}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `加载失败：${res.status}`);
  }
  const data = (await res.json()) as { file: FileDetail };
  return data.file;
}

async function fetchDownloadUrl(fileId: string): Promise<string | null> {
  const res = await fetch(`/api/files/${fileId}/download-url`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message || `获取下载链接失败：${res.status}`);
  }
  const data = (await res.json()) as { downloadUrl?: string };
  return data.downloadUrl || null;
}

export default async function DocumentFileDetailPage({ params }: PageProps) {
  const { id: fileId } = await params;
  const appInternalUrl = env.APP_INTERNAL_URL;
  const onlyOfficeUrl = env.ONLYOFFICE_URL;

  const {
    data: file,
    isLoading: fileLoading,
    error: fileError,
    refetch: refetchFile,
  } = useQuery({
    queryKey: ["file-detail", fileId],
    queryFn: () => fetchFileDetail(fileId),
  });

  const {
    data: downloadUrl,
    isLoading: downloadLoading,
    refetch: refetchDownload,
  } = useQuery({
    queryKey: ["file-download-url", fileId],
    queryFn: () => fetchDownloadUrl(fileId),
  });

  const loading = fileLoading || downloadLoading;
  const error = fileError ? (fileError instanceof Error ? fileError.message : "加载失败") : null;
  const ext = (file?.ext || "").toLowerCase();
  const canPreviewWithOnlyOffice = OFFICE_EXTENSIONS.has(ext);
  const officeFileUrl = `${appInternalUrl.replace(/\/$/, "")}/api/onlyoffice/files/${fileId}`;

  const handleRefresh = () => {
    void refetchFile();
    void refetchDownload();
  };

  return (
    <section className="flex flex-1 flex-col space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/documents">
            <ArrowLeft className="size-4" />
            返回文档中心
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="size-4" />
            刷新
          </Button>
          {downloadUrl ? (
            <Button asChild size="sm">
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <Download className="size-4" />
                下载原文件
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          正在加载文件详情…
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          <AlertCircle className="size-4" />
          {error}
        </div>
      ) : null}

      {!loading && !error && file ? (
        <div className="flex-1">
          <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
            {canPreviewWithOnlyOffice ? (
              <DocumentEditor
                id="onlyoffice-editor"
                documentServerUrl={onlyOfficeUrl.replace(/\/$/, "")}
                config={{
                  documentType: getDocumentType(ext),
                  type: "embedded",
                  document: {
                    title: file.name,
                    url: officeFileUrl,
                    fileType: ext || "docx",
                    key: `${file.id}-${new Date(file.updatedAt).getTime()}`,
                  },
                  editorConfig: {
                    mode: "view",
                    lang: "zh-CN",
                    customization: {
                      comments: false,
                      plugins: false,
                      hideRulers: true,
                      hideNotes: true,
                    },
                  },
                }}
                height="100%"
                width="100%"
              />
            ) : (
              <div className="flex h-[560px] flex-col items-center justify-center gap-3 rounded-xl border border-border border-dashed bg-background text-center">
                <FileText className="size-10 text-muted-foreground" />
                <p className="font-medium text-sm">当前文件类型暂不支持 OnlyOffice 预览</p>
                <p className="text-muted-foreground text-xs">
                  仅支持 Office 文档（Word / Excel / PowerPoint / PDF / ODF / TXT 等）
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
