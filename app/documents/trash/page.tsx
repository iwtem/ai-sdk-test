import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SearchInput } from "~/components/search-input";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { db } from "~/lib/db";
import { FileTypeIcon, fileVisualTypeLabels, normalizeType } from "../document-file-type";
import { DocumentHeader } from "../document-header";
import { formatBytes, formatDateTime, statusTextMap } from "../format";
import { TrashFileActionsMenu } from "./trash-actions";

interface DocumentsTrashPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function DocumentsTrashPage({ searchParams }: DocumentsTrashPageProps) {
  const { q } = await searchParams;
  const keyword = q?.trim();

  const trashFiles = await db.file.findMany({
    where: {
      status: "deleted",
      ...(keyword ? { name: { contains: keyword, mode: "insensitive" } } : {}),
    },
  });

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

      <div className="flex flex-col gap-3">
        <SearchInput placeholder="搜索已删除文件名" />

        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead style={{ width: "38%" }}>文件名</TableHead>
                <TableHead style={{ width: "16%" }}>大小</TableHead>
                <TableHead style={{ width: "22%" }}>更新时间</TableHead>
                <TableHead style={{ width: "16%" }}>上传人</TableHead>
                <TableHead style={{ width: "8%" }} className="text-center">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trashFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                trashFiles.map((file) => {
                  const vt = normalizeType(file.ext, file.mimeType);
                  return (
                    <TableRow key={file.id} className="text-sm hover:bg-muted/40">
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="text-muted-foreground">
                            <FileTypeIcon type={vt} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              <Link href={`/documents/${file.id}`} className="hover:underline">
                                {file.name}
                              </Link>
                            </p>
                            <p className="truncate text-muted-foreground text-xs">
                              {fileVisualTypeLabels[vt]} · {statusTextMap[file.status]}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatBytes(file.sizeBytes)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(file.updatedAt.toISOString())}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {file.createdBy || "未知"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <TrashFileActionsMenu file={file} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
