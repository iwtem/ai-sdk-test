import { UploadCloud } from "lucide-react";
import { Button } from "~/components/ui/button";

type DocumentPageHeaderProps = {
  uploading: boolean;
  onUploadClick: () => void;
};

export function DocumentPageHeader({ uploading, onUploadClick }: DocumentPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs uppercase tracking-[0.18em]">Document Center</p>
        <h1 className="font-semibold text-3xl tracking-tight">文档中心</h1>
        <p className="text-muted-foreground text-sm">
          上传、管理并快速定位团队文档（数据来自接口）。
        </p>
      </div>

      <Button className="w-full sm:w-auto" onClick={onUploadClick} disabled={uploading}>
        <UploadCloud className="size-4" />
        {uploading ? "上传中..." : "上传文档"}
      </Button>
    </header>
  );
}
