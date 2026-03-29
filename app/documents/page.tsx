"use client";

import { Suspense } from "react";
import { DocumentFileBrowser } from "./document-file-browser";
import { DocumentPageHeader } from "./document-page-header";
import { DocumentStats } from "./document-stats";
import { DocumentUploadTasks } from "./document-upload-tasks";
import { DocumentUploadZone } from "./document-upload-zone";
import { useDocumentsPage } from "./use-documents-page";

function DocumentsPageContent() {
  const {
    viewMode,
    setViewMode,
    trashView,
    setTrashViewMode,
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
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DocumentPageHeader uploading={uploading} onUploadClick={handleSelectFile} />

        <DocumentStats items={statItems} />

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
          onTrashViewChange={setTrashViewMode}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          hasMoreFiles={hasMoreFiles}
          loadingMore={loadingMore}
          onLoadMore={loadMoreFiles}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onSearch={fetchFiles}
          loading={loading}
          error={error}
          uploadMessage={uploadMessage}
          files={files}
          subfolderCount={subfolders.length}
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
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <section className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-muted-foreground text-sm">加载文档中心…</p>
          </div>
        </section>
      }
    >
      <DocumentsPageContent />
    </Suspense>
  );
}
