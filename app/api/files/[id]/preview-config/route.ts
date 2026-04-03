import { and, eq, isNull } from "drizzle-orm";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { env } from "~/lib/env.mjs";

type RouteContext = { params: Promise<{ id: string }> };

type PreviewDocType = "word" | "cell" | "slide" | "pdf";

function resolvePreviewType(ext: string, mimeType: string): PreviewDocType | null {
  const e = ext.toLowerCase();
  const m = mimeType.toLowerCase();

  if (e === "pdf" || m === "application/pdf") return "pdf";

  const wordExts = new Set(["doc", "docx", "docm", "dot", "dotm", "dotx", "rtf", "odt", "txt", "md"]);
  if (wordExts.has(e) || m.includes("wordprocessingml") || m === "application/msword") return "word";

  const cellExts = new Set(["xls", "xlsx", "xlsm", "xlsb", "csv", "ods", "tsv"]);
  if (cellExts.has(e) || m.includes("spreadsheetml") || m === "application/vnd.ms-excel") return "cell";

  const slideExts = new Set(["ppt", "pptx", "pptm", "pps", "ppsx", "odp"]);
  if (slideExts.has(e) || m.includes("presentationml") || m.includes("powerpoint")) return "slide";

  return null;
}

function normalizeFileType(ext: string, fallback: PreviewDocType): string {
  const cleaned = ext.replace(/^\./, "").toLowerCase();
  if (cleaned) return cleaned;
  if (fallback === "cell") return "xlsx";
  if (fallback === "slide") return "pptx";
  if (fallback === "pdf") return "pdf";
  return "docx";
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const [file] = await db
      .select({
        id: files.id,
        name: files.name,
        ext: files.ext,
        mimeType: files.mimeType,
        storageKey: files.storageKey,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .where(and(eq(files.id, id), isNull(files.deletedAt)));

    if (!file) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const documentType = resolvePreviewType(file.ext, file.mimeType);
    if (!documentType) {
      return Response.json(
        { message: "该文件类型暂不支持在线预览，请使用下载查看。" },
        { status: 415 },
      );
    }

    const appBaseUrl = (process.env.APP_INTERNAL_URL || "http://host.docker.internal:3006").replace(
      /\/$/,
      "",
    );
    const previewUrl = `${appBaseUrl}/api/files/${file.id}/preview-file`;

    return Response.json({
      onlyofficeUrl: env.ONLYOFFICE_URL,
      config: {
        document: {
          title: file.name,
          url: previewUrl,
          fileType: normalizeFileType(file.ext, documentType),
          key: `${file.id}-${new Date(file.updatedAt).getTime()}`,
        },
        documentType,
        editorConfig: {
          mode: "view",
          lang: "zh-CN",
          customization: {
            compactHeader: true,
            toolbarHideFileName: false,
          },
        },
        type: "desktop",
      },
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
