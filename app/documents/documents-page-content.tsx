"use client";

import { FileUp, FolderOpen, HardDrive } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect, useMemo } from "react";
import { DocumentFileBrowser } from "./document-file-browser";
import { DocumentPageHeader } from "./document-page-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
import { DOCUMENTS_PATH, DOCUMENTS_TRASH_PATH, normalizeDocumentsPathname } from "./documents-url";
import { formatBytes } from "./format";
import { useDocumentsPage } from "./use-documents-page";

/** 将旧 bookmark `/documents?trash=1` 迁到 `/documents/trash?…` */
function LegacyTrashQueryRedirect() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useLayoutEffect(() => {
    if (normalizeDocumentsPathname(pathname) !== DOCUMENTS_PATH) return;
    const sp = new URLSearchParams(searchParams.toString());
    if (sp.get("trash") !== "1" && sp.get("trash") !== "true") return;
    sp.delete("trash");
    sp.delete("folder");
    const qs = sp.toString();
    router.replace(qs ? `${DOCUMENTS_TRASH_PATH}?${qs}` : DOCUMENTS_TRASH_PATH, { scroll: false });
  }, [pathname, searchParams, router]);

  return null;
}

export function DocumentsPageFallback({
  loadingLabel = "加载文档中心…",
}: {
  loadingLabel?: string;
}) {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-muted-foreground text-sm">{loadingLabel}</p>
      </div>
    </section>
  );
}

export function DocumentsPageContent() {
  const {
    url,
    keywordDraft,
    setKeywordDraft,
    filesQuery,
    files,
    stats,
    foldersQuery,
    breadcrumbQuery,
    uploading,
    uploadTasks,
    uploadFiles,
    handleSelectFile,
    retryTask,
  } = useDocumentsPage();

  const filesError = filesQuery.error
    ? filesQuery.error instanceof Error
      ? filesQuery.error.message
      : "加载失败"
    : null;

  const statItems = useMemo(
    () => [
      {
        label: url.trashView ? "回收站文件" : "文件总数",
        value: `${stats.totalCount}`,
        icon: FolderOpen,
      },
      { label: "已用空间", value: formatBytes(stats.totalSize), icon: HardDrive },
      {
        label: url.trashView ? "近 7 日删除" : "本周上传",
        value: `${stats.weeklyUploaded}`,
        icon: FileUp,
      },
    ],
    [stats, url.trashView],
  );

  return (
    <>
      <LegacyTrashQueryRedirect />
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {url.trashView ? (
            <DocumentPageHeader variant="trash" documentsBrowseHref={url.documentsBrowseHref} />
          ) : (
            <>
              <DocumentPageHeader
                uploading={uploading}
                onUploadClick={handleSelectFile}
                trashEntryHref={url.trashEntryHref}
              />
              <DocumentStats items={statItems} />
            </>
          )}

          {!url.trashView ? (
            <>
              <DocumentUploadZone uploading={uploading} onFiles={uploadFiles} />
              <DocumentUploadTasks tasks={uploadTasks} uploading={uploading} onRetry={retryTask} />
            </>
          ) : null}

          <DocumentFileBrowser
            url={url}
            keywordDraft={keywordDraft}
            onKeywordChange={setKeywordDraft}
            filesQuery={filesQuery}
            files={files}
            error={filesError}
            foldersLoading={foldersQuery.isLoading}
            subfolders={foldersQuery.data ?? []}
            breadcrumb={breadcrumbQuery.data ?? []}
          />
        </div>
      </section>
    </>
  );
}
