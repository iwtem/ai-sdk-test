import { ArrowLeft, Trash2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

type DocumentPageHeaderDocumentsProps = {
  variant?: "documents";
  uploading: boolean;
  onUploadClick: () => void;
  trashEntryHref: string;
};

type DocumentPageHeaderTrashProps = {
  variant: "trash";
  documentsBrowseHref: string;
};

export type DocumentPageHeaderProps =
  | DocumentPageHeaderDocumentsProps
  | DocumentPageHeaderTrashProps;

export function DocumentPageHeader(props: DocumentPageHeaderProps) {
  if (props.variant === "trash") {
    return (
      <header className="flex flex-col gap-4 border-border border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Recycle Bin</p>
          <h1 className="font-semibold text-3xl tracking-tight">回收站</h1>
          <p className="text-muted-foreground text-sm">
            查看已删除的文档，可恢复至原位置或彻底删除（不可恢复）。
          </p>
        </div>
        <Button variant="outline" className="w-full shrink-0 sm:w-auto" asChild>
          <Link href={props.documentsBrowseHref} scroll={false}>
            <ArrowLeft className="size-4" />
            返回文档中心
          </Link>
        </Button>
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Document Center</p>
        <h1 className="font-semibold text-3xl tracking-tight">文档中心</h1>
        <p className="text-muted-foreground text-sm">
          上传、管理并快速定位团队文档（数据来自接口）。
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href={props.trashEntryHref} scroll={false}>
            <Trash2 className="size-4" />
            回收站
          </Link>
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={props.onUploadClick}
          disabled={props.uploading}
        >
          <UploadCloud className="size-4" />
          {props.uploading ? "上传中..." : "上传文档"}
        </Button>
      </div>
    </header>
  );
}
