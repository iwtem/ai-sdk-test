import { errorResponse, successResponse } from "~/lib/api/response";
import { db } from "~/lib/db";
import { createDownloadSignedUrl } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return errorResponse("缺少文件 id", 400);
    }

    const file = await db.file.findFirst({
      where: { id, deletedAt: null },
      select: {
        storageKey: true,
        name: true,
      },
    });

    if (!file) {
      return errorResponse("文件不存在", 404);
    }

    const { downloadUrl, expiresIn } = await createDownloadSignedUrl({
      key: file.storageKey,
      fileName: file.name,
    });

    return successResponse({ downloadUrl, expiresIn });
  } catch (error) {
    console.error("[files/download-url]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
