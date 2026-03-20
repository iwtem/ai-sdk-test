"use client";

import {
  CalendarDays,
  FileArchive,
  FileAudio2,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileUp,
  FileVideo2,
  FolderOpen,
  Grid2x2,
  HardDrive,
  List,
  Search,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type ViewMode = "card" | "list";

type FileItem = {
  id: string;
  name: string;
  ext: string;
  type: "doc" | "sheet" | "image" | "video" | "audio" | "archive" | "code";
  size: string;
  updatedAt: string;
  owner: string;
  tags: string[];
};

const files: FileItem[] = [
  {
    id: "f-001",
    name: "产品需求说明书",
    ext: "PDF",
    type: "doc",
    size: "1.8 MB",
    updatedAt: "2026-03-20 10:24",
    owner: "王晨",
    tags: ["需求", "核心文档"],
  },
  {
    id: "f-002",
    name: "Q2 投放预算",
    ext: "XLSX",
    type: "sheet",
    size: "620 KB",
    updatedAt: "2026-03-19 16:42",
    owner: "李琪",
    tags: ["财务", "预算"],
  },
  {
    id: "f-003",
    name: "首页视觉规范",
    ext: "PNG",
    type: "image",
    size: "4.3 MB",
    updatedAt: "2026-03-18 11:05",
    owner: "陈柚",
    tags: ["设计", "品牌"],
  },
  {
    id: "f-004",
    name: "演示录屏-新手引导",
    ext: "MP4",
    type: "video",
    size: "28.5 MB",
    updatedAt: "2026-03-16 20:12",
    owner: "郑航",
    tags: ["培训", "视频"],
  },
  {
    id: "f-005",
    name: "客服问答语料",
    ext: "TXT",
    type: "doc",
    size: "94 KB",
    updatedAt: "2026-03-15 09:48",
    owner: "张宁",
    tags: ["运营", "语料"],
  },
  {
    id: "f-006",
    name: "上传接口草案",
    ext: "TS",
    type: "code",
    size: "33 KB",
    updatedAt: "2026-03-14 14:33",
    owner: "刘川",
    tags: ["研发", "草案"],
  },
];

function FileTypeIcon({ type }: { type: FileItem["type"] }) {
  switch (type) {
    case "doc":
      return <FileText className="size-5" />;
    case "sheet":
      return <FileSpreadsheet className="size-5" />;
    case "image":
      return <FileImage className="size-5" />;
    case "video":
      return <FileVideo2 className="size-5" />;
    case "audio":
      return <FileAudio2 className="size-5" />;
    case "archive":
      return <FileArchive className="size-5" />;
    case "code":
      return <FileCode2 className="size-5" />;
    default:
      return <FileText className="size-5" />;
  }
}

export default function FilesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const statItems = useMemo(
    () => [
      { label: "文件总数", value: "126", icon: <FolderOpen className="size-4" /> },
      { label: "已用空间", value: "8.4 GB", icon: <HardDrive className="size-4" /> },
      { label: "本周上传", value: "32", icon: <FileUp className="size-4" /> },
    ],
    [],
  );

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
              File Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">文件中心</h1>
            <p className="text-sm text-muted-foreground">
              上传、管理并快速定位团队文件（当前页面仅为 UI 演示）。
            </p>
          </div>

          <Button className="w-full sm:w-auto">
            <UploadCloud className="size-4" />
            上传文件
          </Button>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {statItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-card px-4 py-3"
            >
              <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                {item.icon}
                {item.label}
              </div>
              <div className="text-2xl font-semibold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-border/90 bg-muted/30 p-5 sm:p-7">
          <div className="flex flex-col items-start gap-3">
            <div className="rounded-xl bg-background p-2 text-muted-foreground">
              <UploadCloud className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-medium">拖拽文件到这里，或点击选择文件</h2>
              <p className="text-sm text-muted-foreground">
                支持 PDF / DOCX / XLSX / PNG / MP4 等格式，单文件上限 100MB
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary">选择文件</Button>
              <Button variant="ghost">新建文件夹</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="搜索文件名、标签或上传人" className="pl-8" />
            </div>

            <div className="inline-flex items-center gap-2 self-end md:self-auto">
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("card")}
              >
                <Grid2x2 className="size-4" />
                卡片
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
                列表
              </Button>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => (
                <article
                  key={file.id}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <FileTypeIcon type={file.type} />
                      <span className="text-xs font-medium">{file.ext}</span>
                    </div>
                    <Badge variant="outline">{file.size}</Badge>
                  </div>

                  <h3 className="mb-2 line-clamp-1 font-medium">{file.name}</h3>

                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {file.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      更新于 {file.updatedAt}
                    </p>
                    <p>上传人：{file.owner}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr] items-center bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
                <span>文件名</span>
                <span>大小</span>
                <span>更新时间</span>
                <span>上传人</span>
              </div>

              <div className="divide-y divide-border">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="grid grid-cols-[1.6fr_0.7fr_1fr_0.9fr] items-center px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-muted-foreground">
                        <FileTypeIcon type={file.type} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{file.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {file.tags.join(" / ")}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground">{file.size}</span>
                    <span className="text-muted-foreground">{file.updatedAt}</span>
                    <span className="text-muted-foreground">{file.owner}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
