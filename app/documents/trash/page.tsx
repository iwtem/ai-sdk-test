"use client";

import { Suspense } from "react";
import { DocumentsPageContent, DocumentsPageFallback } from "../documents-page-content";

export default function DocumentsTrashPage() {
  return (
    <Suspense fallback={<DocumentsPageFallback loadingLabel="加载回收站…" />}>
      <DocumentsPageContent />
    </Suspense>
  );
}
