"use client";

import { UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "~/components/ui/button";

type DocumentUploadZoneProps = {
  uploading: boolean;
  onFiles: (files: File[]) => void;
};

export function DocumentUploadZone({ uploading, onFiles }: DocumentUploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: onFiles,
    noClick: false,
    disabled: uploading,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-2xl border border-dashed p-5 transition-colors sm:p-7 ${
        isDragActive ? "border-primary bg-primary/5" : "border-border/90 bg-muted/30"
      }`}
    >
      <input {...getInputProps()} />
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
          <Button type="button" variant="secondary" onClick={open} disabled={uploading}>
            {uploading ? "上传中..." : "选择文件"}
          </Button>
        </div>
      </div>
    </div>
  );
}
