"use client";

import { Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { DocumentFileBrowser } from "./document-file-browser";
import { DocumentHeader } from "./document-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
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

  return (
    <DocumentUploadZone uploading={uploading} onFiles={uploadFiles}>
      <section className="space-y-6">
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

        <DocumentStats
          totalCount={stats.totalCount}
          totalSize={stats.totalSize}
          weeklyUploaded={stats.weeklyUploaded}
        />

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
      </section>
    </DocumentUploadZone>
  );
}
