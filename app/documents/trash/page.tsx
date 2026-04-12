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
    <section className="space-y-6">
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
    </section>
  );
}
