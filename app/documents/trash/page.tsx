"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { DocumentFileBrowser } from "../document-file-browser";
import { DocumentHeader } from "../document-header";
import { useDocumentsPage } from "../use-documents-page";

export default function DocumentsTrashPage() {
  const { url, keywordDraft, setKeywordDraft, filesQuery, files, foldersQuery, breadcrumbQuery } =
    useDocumentsPage();

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <DocumentHeader
          title="回收站"
          description="查看已删除的文档，可恢复至原位置或彻底删除（不可恢复）。"
          extra={
            <Button variant="outline" asChild>
              <Link href="/documents" scroll={false}>
                <ArrowLeft />
                返回文档中心
              </Link>
            </Button>
          }
        />

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
