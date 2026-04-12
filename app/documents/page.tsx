"use client";

import { FileUp, FolderOpen, HardDrive, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Button } from "~/components/ui/button";
import { DocumentFileBrowser } from "./document-file-browser";
import { DocumentHeader } from "./document-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
import { formatBytes } from "./format";
import { useDocumentsPage } from "./use-documents-page";

export default function DocumentsPage() {
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

  const statItems = useMemo(
    () => [
      {
        label: "文件总数",
        value: `${stats.totalCount}`,
        icon: FolderOpen,
      },
      { label: "已用空间", value: formatBytes(stats.totalSize), icon: HardDrive },
      {
        label: "本周上传",
        value: `${stats.weeklyUploaded}`,
        icon: FileUp,
      },
    ],
    [stats],
  );

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DocumentHeader
          title="文档中心"
          description="上传、管理并快速定位团队文档（数据来自接口）。"
          extra={
            <>
              <Button variant="outline" asChild>
                <Link href="/documents/trash" scroll={false}>
                  <Trash2 />
                  回收站
                </Link>
              </Button>
              <Button onClick={handleSelectFile} disabled={uploading}>
                <UploadCloud />
                {uploading ? "上传中..." : "上传文档"}
              </Button>
            </>
          }
        />
        <DocumentStats items={statItems} />

        <DocumentUploadZone uploading={uploading} onFiles={uploadFiles} />
        <DocumentUploadTasks tasks={uploadTasks} uploading={uploading} onRetry={retryTask} />

        <DocumentFileBrowser
          url={url}
          keywordDraft={keywordDraft}
          onKeywordChange={setKeywordDraft}
          filesQuery={filesQuery}
          files={files}
          foldersLoading={foldersQuery.isLoading}
          subfolders={foldersQuery.data ?? []}
          breadcrumb={breadcrumbQuery.data ?? []}
        />
      </div>
    </section>
  );
}
