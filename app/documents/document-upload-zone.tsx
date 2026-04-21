"use client";

import { UploadCloud } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useDropzone } from "react-dropzone";

interface DocumentUploadZoneProps {
  uploading: boolean;
  onFilesAction: (files: File[]) => void;
}

export function DocumentUploadZone(props: PropsWithChildren<DocumentUploadZoneProps>) {
  const { uploading, onFilesAction, children } = props;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    noClick: true,
    noKeyboard: true,
    disabled: uploading,
    onDrop: onFilesAction,
  });

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      {children}
      {isDragActive && !uploading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl border-2 border-primary border-dashed bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <UploadCloud className="size-10" />
            <p className="font-medium text-lg">松开鼠标上传文件</p>
            <p className="text-muted-foreground text-sm">
              仅支持文档类文件（PDF、Office、纯文本等）
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
