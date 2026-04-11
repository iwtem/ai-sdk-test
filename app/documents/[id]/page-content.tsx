"use client";

import { DocumentEditor } from "@onlyoffice/document-editor-react";
import { AlertCircle, ArrowLeft, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import type { statusTextMap } from "../format";

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

type Props = {
  fileId: string;
  onlyOfficeUrl: string;
  appInternalUrl: string;
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

export function FileDetailPageContent({ fileId, onlyOfficeUrl, appInternalUrl }: Props) {
  const [file, setFile] = useState<FileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [editorFailed, setEditorFailed] = useState<string | null>(null);

  const ext = useMemo(() => (file?.ext || "").toLowerCase(), [file?.ext]);
  const canPreviewWithOnlyOffice = useMemo(() => OFFICE_EXTENSIONS.has(ext), [ext]);
  const officeFileUrl = useMemo(
    () => `${appInternalUrl.replace(/\/$/, "")}/api/onlyoffice/files/${fileId}`,
    [appInternalUrl, fileId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFile() {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, downloadRes] = await Promise.all([
          fetch(`/api/files/${fileId}`),
          fetch(`/api/files/${fileId}/download-url`),
        ]);

        if (!detailRes.ok) {
          const body = (await detailRes.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message || `加载失败：${detailRes.status}`);
        }
        const detailData = (await detailRes.json()) as { file: FileDetail };

        if (!downloadRes.ok) {
          const body = (await downloadRes.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message || `获取下载链接失败：${downloadRes.status}`);
        }
        const downloadData = (await downloadRes.json()) as { downloadUrl?: string };

        if (!cancelled) {
          setFile(detailData.file);
          setDownloadUrl(downloadData.downloadUrl || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "加载失败");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFile();

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return (
    <section className="h-full min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
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
              onClick={() => window.location.reload()}
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
                editorFailed ? (
                  <div className="flex h-[560px] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                    {editorFailed}
                  </div>
                ) : (
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
                    onLoadComponentError={(_errorCode, errorDescription) => {
                      setEditorFailed(errorDescription || "OnlyOffice 初始化失败。");
                    }}
                  />
                )
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
      </div>
    </section>
  );
}
