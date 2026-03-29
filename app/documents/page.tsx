"use client";

import { Suspense } from "react";
import { DocumentsPageContent, DocumentsPageFallback } from "./documents-page-content";

export default function DocumentsPage() {
  return (
    <Suspense fallback={<DocumentsPageFallback />}>
      <DocumentsPageContent />
    </Suspense>
  );
}
