import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { extractExt } from "~/lib/files/extract-ext";
import { getFolderById } from "~/lib/folders/folder-service";

const patchSchema = z
  .object({
    folderId: z.union([z.string().min(1), z.null()]).optional(),
    name: z.string().min(1).max(512).optional(),
    restore: z.literal(true).optional(),
  })
  .superRefine((val, ctx) => {
    const hasRestore = val.restore === true;
    const hasOther =
      val.folderId !== undefined || val.name !== undefined;
    if (!hasRestore && !hasOther) {
      ctx.addIssue({
        code: "custom",
        message: "至少需要提供 folderId、name 或 restore: true",
      });
    }
    if (hasRestore && hasOther) {
      ctx.addIssue({
        code: "custom",
        message: "恢复时不要同时提交其他字段",
      });
    }
  });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    if (parsed.restore === true) {
      const [deleted] = await db
        .select({ id: files.id })
        .from(files)
        .where(and(eq(files.id, id), isNotNull(files.deletedAt)));

      if (!deleted) {
        return Response.json({ message: "文件未在回收站或不存在" }, { status: 404 });
      }

      const [restored] = await db
        .update(files)
        .set({
          deletedAt: null,
          status: "uploaded",
          updatedAt: sql`now()`,
        })
        .where(and(eq(files.id, id), isNotNull(files.deletedAt)))
        .returning();

      if (!restored) {
        return Response.json({ message: "恢复失败" }, { status: 404 });
      }
      return Response.json({ file: restored });
    }

    if (parsed.folderId) {
      const folder = await getFolderById(parsed.folderId);
      if (!folder) {
        return Response.json({ message: "目标文件夹不存在" }, { status: 404 });
      }
    }

    const [existing] = await db
      .select({
        id: files.id,
        folderId: files.folderId,
        name: files.name,
      })
      .from(files)
      .where(and(eq(files.id, id), isNull(files.deletedAt)));

    if (!existing) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const nextFolderId =
      parsed.folderId !== undefined ? (parsed.folderId ?? null) : (existing.folderId ?? null);
    const nextName = parsed.name !== undefined ? parsed.name.trim() : existing.name;
    if (parsed.name !== undefined && !nextName) {
      return Response.json({ message: "文件名不能为空" }, { status: 400 });
    }

    const nextExt = parsed.name !== undefined ? extractExt(nextName) : undefined;

    const folderUnchanged =
      parsed.folderId === undefined || (existing.folderId ?? null) === nextFolderId;
    const nameUnchanged = parsed.name === undefined || existing.name === nextName;

    if (folderUnchanged && nameUnchanged) {
      const [row] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, id), isNull(files.deletedAt)));
      return Response.json({ file: row });
    }

    const [updated] = await db
      .update(files)
      .set({
        ...(parsed.folderId !== undefined ? { folderId: nextFolderId } : {}),
        ...(parsed.name !== undefined
          ? { name: nextName, ext: nextExt ?? "" }
          : {}),
        updatedAt: sql`now()`,
      })
      .where(and(eq(files.id, id), isNull(files.deletedAt)))
      .returning();

    if (!updated) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    return Response.json({ file: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ message: "请求体无效", errors: error.issues }, { status: 400 });
    }
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const [updated] = await db
      .update(files)
      .set({
        status: "deleted",
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(files.id, id), isNull(files.deletedAt)))
      .returning({ id: files.id });

    if (!updated) {
      return Response.json({ message: "文件不存在或已删除" }, { status: 404 });
    }

    return Response.json({ ok: true, id: updated.id });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
