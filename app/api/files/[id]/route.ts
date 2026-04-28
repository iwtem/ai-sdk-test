import { z } from "zod";
import { db } from "~/lib/db";
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
      const deleted = await db.file.findFirst({
        where: { id, deletedAt: { not: null } },
        select: { id: true },
      });

      if (!deleted) {
        return Response.json({ message: "文件未在回收站或不存在" }, { status: 404 });
      }

      const restored = await db.file.updateMany({
        where: { id, deletedAt: { not: null } },
        data: {
          deletedAt: null,
          status: "uploaded",
        },
      });

      if (restored.count === 0) {
        return Response.json({ message: "恢复失败" }, { status: 404 });
      }
      const file = await db.file.findUnique({ where: { id } });
      return Response.json({ file });
    }

    if (parsed.folderId) {
      const folder = await getFolderById(parsed.folderId);
      if (!folder) {
        return Response.json({ message: "目标文件夹不存在" }, { status: 404 });
      }
    }

    const existing = await db.file.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, folderId: true, name: true },
    });

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
      const row = await db.file.findFirst({
        where: { id, deletedAt: null },
      });
      return Response.json({ file: row });
    }

    const updated = await db.file.updateMany({
      where: { id, deletedAt: null },
      data: {
        ...(parsed.folderId !== undefined ? { folderId: nextFolderId } : {}),
        ...(parsed.name !== undefined
          ? { name: nextName, ext: nextExt ?? "" }
          : {}),
      },
    });

    if (updated.count === 0) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const file = await db.file.findUnique({ where: { id } });
    return Response.json({ file });
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const file = await db.file.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        ext: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        folderId: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!file) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    return Response.json({ file });
  } catch (error) {
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

    const updated = await db.file.updateMany({
      where: { id, deletedAt: null },
      data: {
        status: "deleted",
        deletedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return Response.json({ message: "文件不存在或已删除" }, { status: 404 });
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
