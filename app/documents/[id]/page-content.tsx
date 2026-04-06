"use client";

import { AlertCircle, ArrowLeft, Download, FileText, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { formatBytes, formatDateTime, type statusTextMap } from "../format";

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

type OnlyOfficeDocEditor = {
  destroyEditor?: () => void;
};

type OnlyOfficeWindow = Window & {
  DocsAPI?: {
    DocEditor: new (holderId: string, config: Record<string, unknown>) => OnlyOfficeDocEditor;
  };
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
  const [editorReady, setEditorReady] = useState(false);
  const [editorFailed, setEditorFailed] = useState<string | null>(null);
  const editorRef = useRef<OnlyOfficeDocEditor | null>(null);

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

  useEffect(() => {
    if (!file || !canPreviewWithOnlyOffice || !onlyOfficeUrl) return;

    setEditorReady(false);
    setEditorFailed(null);

    const script = document.createElement("script");
    script.src = `${onlyOfficeUrl.replace(/\/$/, "")}/web-apps/apps/api/documents/api.js`;
    script.async = true;

    script.onload = () => {
      const win = window as OnlyOfficeWindow;
      if (!win.DocsAPI?.DocEditor) {
        setEditorFailed("OnlyOffice 初始化失败：未找到 DocsAPI。");
        return;
      }
      try {
        editorRef.current?.destroyEditor?.();
        editorRef.current = new win.DocsAPI.DocEditor("onlyoffice-editor", {
          width: "100%",
          height: "100%",
          documentType: getDocumentType(ext),
          type: "desktop",
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
              compactHeader: true,
              compactToolbar: true,
              toolbarNoTabs: true,
              hideRightMenu: true,
              hideRulers: true,
              hideNotes: true,
            },
          },
        });
        setEditorReady(true);
      } catch (err) {
        setEditorFailed(err instanceof Error ? err.message : "OnlyOffice 初始化失败。");
      }
    };

    script.onerror = () => setEditorFailed("OnlyOffice 脚本加载失败，请检查服务是否可访问。");
    document.body.appendChild(script);

    return () => {
      editorRef.current?.destroyEditor?.();
      editorRef.current = null;
      script.remove();
    };
  }, [file, canPreviewWithOnlyOffice, onlyOfficeUrl, ext, officeFileUrl]);

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
            <div className="h-full rounded-2xl border border-border bg-card p-3">
              {canPreviewWithOnlyOffice ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    {!editorReady && !editorFailed ? (
                      <p className="text-muted-foreground text-xs">初始化预览器中…</p>
                    ) : null}
                  </div>
                  {editorFailed ? (
                    <div className="flex h-[560px] items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
                      {editorFailed}
                    </div>
                  ) : (
                    <div
                      id="onlyoffice-editor"
                      className="h-[560px] w-full overflow-hidden rounded-xl"
                    />
                  )}
                </>
              ) : (
                <div className="flex h-[560px] flex-col items-center justify-center gap-3 rounded-xl border border-border border-dashed bg-background text-center">
                  <FileText className="size-10 text-muted-foreground" />
                  <p className="font-medium text-sm">当前文件类型暂不支持 OnlyOffice 预览</p>
                  <p className="text-muted-foreground text-xs">
                    仅支持 Office 文档（Word / Excel / PowerPoint / ODF / TXT 等）
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
