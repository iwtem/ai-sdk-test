import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { deleteObjectByKey } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

/** 仅允许彻底删除已软删的文件；删除对象存储中的对象并移除数据库行 */
export async function POST(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const [row] = await db
      .select({
        id: files.id,
        storageKey: files.storageKey,
      })
      .from(files)
      .where(and(eq(files.id, id), isNotNull(files.deletedAt)));

    if (!row) {
      return Response.json({ message: "仅可回收站中的文件可彻底删除" }, { status: 404 });
    }

    try {
      await deleteObjectByKey(row.storageKey);
    } catch (err) {
      return Response.json(
        {
          message: err instanceof Error ? err.message : "对象存储删除失败",
        },
        { status: 502 },
      );
    }

    await db.delete(files).where(eq(files.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
