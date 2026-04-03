"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "~/components/ui/button";

type PreviewConfigResponse = {
  onlyofficeUrl: string;
  config: Record<string, unknown>;
};

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (
        placeholderId: string,
        config: Record<string, unknown>,
      ) => {
        destroyEditor?: () => void;
      };
    };
  }
}

function loadOnlyOfficeScript(onlyofficeUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.DocsAPI) {
      resolve();
      return;
    }
    const src = `${onlyofficeUrl.replace(/\/$/, "")}/web-apps/apps/api/documents/api.js`;
    const existed = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existed) {
      existed.addEventListener("load", () => resolve(), { once: true });
      existed.addEventListener("error", () => reject(new Error("ONLYOFFICE 脚本加载失败")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("ONLYOFFICE 脚本加载失败"));
    document.body.appendChild(script);
  });
}

export default function DocumentPreviewPage() {
  const params = useParams<{ id: string }>();
  const fileId = params.id;
  const holderId = useMemo(() => `doc-preview-${fileId}`, [fileId]);
  const editorRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const [loadingText, setLoadingText] = useState("正在加载预览配置…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (!fileId) throw new Error("缺少文件 id");
        const response = await fetch(`/api/files/${fileId}/preview-config`);
        const body = (await response.json().catch(() => ({}))) as
          | PreviewConfigResponse
          | { message?: string };
        if (!response.ok) {
          throw new Error((body as { message?: string }).message || `请求失败：${response.status}`);
        }
        const configBody = body as PreviewConfigResponse;

        setLoadingText("正在加载 ONLYOFFICE…");
        await loadOnlyOfficeScript(configBody.onlyofficeUrl);
        if (cancelled) return;

        if (!window.DocsAPI?.DocEditor) {
          throw new Error("ONLYOFFICE 初始化失败，请检查服务是否可访问。");
        }

        setLoadingText("正在渲染文档…");
        editorRef.current = new window.DocsAPI.DocEditor(holderId, configBody.config);
        setLoadingText("");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "预览失败");
      }
    };

    void init();

    return () => {
      cancelled = true;
      editorRef.current?.destroyEditor?.();
      editorRef.current = null;
    };
  }, [fileId, holderId]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-background p-0">
      {error ? (
        <div className="m-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive text-sm">
          {error}
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div id={holderId} className="h-full w-full" />
          {loadingText ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-muted-foreground text-sm">
              {loadingText}
            </div>
          ) : null}
        </div>
      )}

      <div className="pointer-events-none absolute top-3 right-3 z-10">
        <Button asChild variant="secondary" size="sm" className="pointer-events-auto shadow-sm">
          <Link href="/documents">返回文档中心</Link>
        </Button>
      </div>
    </section>
  );
}
