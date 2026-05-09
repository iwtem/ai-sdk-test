import { errorResponse, successResponse, withErrorHandler } from "~/lib/api/response";
import { db } from "~/lib/db";
import { deleteObjectByKey } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

/** 仅允许彻底删除已软删的文件；删除对象存储中的对象并移除数据库行 */
export const POST = withErrorHandler(async (_request: Request, context: RouteContext) => {
  try {
    const { id } = await context.params;
    if (!id) {
      return errorResponse("缺少文件 id", 400);
    }

    const row = await db.file.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { id: true, storageKey: true },
    });

    if (!row) {
      return errorResponse("仅可回收站中的文件可彻底删除", 404);
    }

    try {
      await deleteObjectByKey(row.storageKey);
    } catch (err) {
      console.error("[files/purge] object storage delete failed", err);
      return errorResponse("删除失败，请稍后重试或联系管理员。", 502);
    }

    await db.file.delete({ where: { id } });

    return successResponse({ ok: true });
  } catch (error) {
    console.error("[files/purge] unexpected error", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
});
