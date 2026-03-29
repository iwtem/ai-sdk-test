"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";
import { DocumentFileBrowser } from "./document-file-browser";
import { DocumentPageHeader } from "./document-page-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
import { DOCUMENTS_PATH, DOCUMENTS_TRASH_PATH, normalizeDocumentsPathname } from "./documents-url";
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
    viewMode,
    setViewMode,
    trashView,
    trashEntryHref,
    documentsBrowseHref,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    hasMoreFiles,
    loadingMore,
    loadMoreFiles,
    currentFolderId,
    navigateToFolder,
    breadcrumb,
    subfolders,
    foldersLoading,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    keyword,
    setKeyword,
    appliedQuery,
    files,
    loading,
    error,
    uploadMessage,
    uploading,
    dragging,
    setDragging,
    uploadTasks,
    fileInputRef,
    fetchFiles,
    handleSelectFile,
    handleFileInputChange,
    handleDrop,
    retryTask,
    statItems,
    moveFile,
    movingFileId,
    deleteFile,
    deletingFileId,
    renameFile,
    restoreFile,
    purgeFile,
    purgingFileId,
    fetchDownloadUrl,
    flashNotice,
  } = useDocumentsPage();

  return (
    <>
      <LegacyTrashQueryRedirect />
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {trashView ? (
            <DocumentPageHeader variant="trash" documentsBrowseHref={documentsBrowseHref} />
          ) : (
            <>
              <DocumentPageHeader
                uploading={uploading}
                onUploadClick={handleSelectFile}
                trashEntryHref={trashEntryHref}
              />
              <DocumentStats items={statItems} />
            </>
          )}

          {!trashView ? (
            <>
              <DocumentUploadZone
                dragging={dragging}
                setDragging={setDragging}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onFileInputChange={handleFileInputChange}
                onSelectClick={handleSelectFile}
                onDrop={handleDrop}
              />

              <DocumentUploadTasks tasks={uploadTasks} uploading={uploading} onRetry={retryTask} />
            </>
          ) : null}

          <DocumentFileBrowser
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            trashView={trashView}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            hasMoreFiles={hasMoreFiles}
            loadingMore={loadingMore}
            onLoadMore={loadMoreFiles}
            keyword={keyword}
            appliedQuery={appliedQuery}
            onKeywordChange={setKeyword}
            onSearch={fetchFiles}
            loading={loading}
            error={error}
            uploadMessage={uploadMessage}
            files={files}
            foldersLoading={foldersLoading}
            currentFolderId={currentFolderId}
            breadcrumb={breadcrumb}
            subfolders={subfolders}
            onMoveFile={moveFile}
            movingFileId={movingFileId}
            onDeleteFile={deleteFile}
            deletingFileId={deletingFileId}
            onRenameFile={renameFile}
            onRestoreFile={restoreFile}
            onPurgeFile={purgeFile}
            purgingFileId={purgingFileId}
            fetchDownloadUrl={fetchDownloadUrl}
            flashNotice={flashNotice}
            onNavigateToFolder={navigateToFolder}
            onRenameFolder={renameFolder}
            onMoveFolder={moveFolder}
            onDeleteFolder={deleteFolder}
            onCreateFolder={createFolder}
          />
        </div>
      </section>
    </>
  );
}
