import { UploadCloud } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "~/components/ui/button";
import { DOCUMENT_FILE_INPUT_ACCEPT } from "~/lib/files/document-upload-allowed";

type DocumentUploadZoneProps = {
  dragging: boolean;
  setDragging: (value: boolean) => void;
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectClick: () => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
};

export function DocumentUploadZone({
  dragging,
  setDragging,
  uploading,
  fileInputRef,
  onFileInputChange,
  onSelectClick,
  onDrop,
}: DocumentUploadZoneProps) {
  return (
    <>
      <input
        id="file-upload-input"
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept={DOCUMENT_FILE_INPUT_ACCEPT}
        onChange={onFileInputChange}
      />

      <label
        className={`rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${
          dragging ? "border-primary bg-primary/5" : "border-border/90 bg-muted/30"
        }`}
        htmlFor="file-upload-input"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-start gap-3">
          <div className="rounded-xl bg-background p-2 text-muted-foreground">
            <UploadCloud className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-medium text-base">拖拽文件到这里，或点击选择文件</h2>
            <p className="text-muted-foreground text-sm">
              仅支持文档类文件（PDF、Office、纯文本等），可多选；图片、音视频、压缩包等无法上传。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={onSelectClick} disabled={uploading}>
              {uploading ? "上传中..." : "选择文件"}
            </Button>
          </div>
        </div>
      </label>
    </>
  );
}
