import { z } from "zod";
import { errorResponse, successResponse } from "~/lib/api/response";
import {
  DOCUMENT_UPLOAD_REJECT_MESSAGE,
  isDocumentUploadAllowed,
} from "~/lib/files/document-upload-allowed";
import { getFolderById } from "~/lib/folders/folder-service";
import { createUploadSignedUrl } from "~/lib/storage/s3";
import { nanoid } from "~/lib/utils";

const requestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().default("application/octet-stream"),
  folderId: z.string().nullable().optional(),
});

const sanitizeFileName = (name: string) =>
  name
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
    .replaceAll(/_{2,}/g, "_")
    .slice(0, 120);

const getDatePrefix = () => {
  const now = new Date();
  const yyyy = `${now.getFullYear()}`;
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    if (!isDocumentUploadAllowed(parsed.fileName, parsed.fileType)) {
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

    const safeName = sanitizeFileName(parsed.fileName);
    const storageKey = `${getDatePrefix()}/${nanoid()}-${safeName}`;

    const result = await createUploadSignedUrl({
      key: storageKey,
      contentType: parsed.fileType,
    });

    return successResponse(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("请求体无效", 400, 400, { errors: error.issues });
    }
    console.error("[files/upload-url]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
