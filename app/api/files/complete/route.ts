import { z } from "zod";
import { errorResponse, successResponse } from "~/lib/api/response";
import { db } from "~/lib/db";
import { env } from "~/lib/env";
import {
  DOCUMENT_UPLOAD_REJECT_MESSAGE,
  isDocumentUploadAllowed,
} from "~/lib/files/document-upload-allowed";
import { extractExt } from "~/lib/files/extract-ext";
import { getFolderById } from "~/lib/folders/folder-service";

const requestSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  sizeBytes: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
  checksumSha256: z.string().length(64).optional(),
  createdBy: z.string().optional(),
  folderId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    if (!isDocumentUploadAllowed(parsed.name, parsed.mimeType)) {
      return errorResponse(DOCUMENT_UPLOAD_REJECT_MESSAGE, 415);
    }

    const folderId =
      parsed.folderId === undefined || parsed.folderId === "" ? null : parsed.folderId;
    if (folderId) {
      const folder = await getFolderById(folderId);
      if (!folder) {
        return errorResponse("文件夹不存在", 404);
      }
    }

    const bucket = env.S3_BUCKET;
    if (!bucket) {
      return errorResponse("对象存储未配置", 500);
    }

    const created = await db.$transaction(async (tx) => {
      const file = await tx.file.create({
        data: {
          name: parsed.name,
          ext: extractExt(parsed.name),
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          bucket,
          storageKey: parsed.storageKey,
          checksumSha256: parsed.checksumSha256,
          createdBy: parsed.createdBy,
          status: "uploaded",
          folderId,
        },
      });

      await tx.fileJob.create({
        data: {
          fileId: file.id,
          jobType: "index",
          status: "pending",
        },
      });

      return file;
    });

    return successResponse({ file: created }, "元数据已保存");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("请求体无效", 400, 400, { errors: error.issues });
    }
    console.error("[files/complete]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
