import { env } from "~/lib/env.mjs";
import { FileDetailPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentFileDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <FileDetailPageContent
      fileId={id}
      onlyOfficeUrl={env.ONLYOFFICE_URL}
      appInternalUrl={env.APP_INTERNAL_URL}
    />
  );
}
