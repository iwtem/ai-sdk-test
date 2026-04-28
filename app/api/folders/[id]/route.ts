import { z } from "zod";
import { db } from "~/lib/db";
import {
  buildBreadcrumb,
  countChildFolders,
  countFilesInFolder,
  getFolderById,
  hasSiblingName,
  wouldCreateFolderCycle,
} from "~/lib/folders/folder-service";

const patchBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    parentId: z.string().nullable().optional(),
  })
  .refine((b) => b.name !== undefined || b.parentId !== undefined, {
    message: "至少需要提供 name 或 parentId",
  });

function normalizeName(name: string) {
  return name.trim();
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const folder = await getFolderById(id);
    if (!folder) {
      return Response.json({ message: "文件夹不存在" }, { status: 404 });
    }
    const breadcrumb = await buildBreadcrumb(id);
    return Response.json({
      folder: {
        id: folder.id,
        parentId: folder.parentId,
        name: folder.name,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
      breadcrumb,
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getFolderById(id);
    if (!existing) {
      return Response.json({ message: "文件夹不存在" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = patchBodySchema.parse(body);

    let nextName = existing.name;
    let nextParentId: string | null = existing.parentId;

    if (parsed.name !== undefined) {
      const name = normalizeName(parsed.name);
      if (!name) {
        return Response.json({ message: "文件夹名称不能为空" }, { status: 400 });
      }
      nextName = name;
    }

    if (parsed.parentId !== undefined) {
      nextParentId =
        parsed.parentId === "" || parsed.parentId === null ? null : parsed.parentId;
      if (nextParentId) {
        const parent = await getFolderById(nextParentId);
        if (!parent) {
          return Response.json({ message: "目标父文件夹不存在" }, { status: 404 });
        }
      }
      if (await wouldCreateFolderCycle(id, nextParentId)) {
        return Response.json({ message: "不能将文件夹移动到自身或其子文件夹下" }, { status: 400 });
      }
    }

    const finalName = nextName;
    const finalParentId = nextParentId;
    if (finalName !== existing.name || finalParentId !== existing.parentId) {
      if (await hasSiblingName(finalParentId, finalName, id)) {
        return Response.json({ message: "同级下已存在同名文件夹" }, { status: 409 });
      }
    }

    const updated = await db.folder.update({
      where: { id },
      data: {
        name: finalName,
        parentId: finalParentId,
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ folder: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { message: "Invalid request body", errors: error.issues },
        { status: 400 },
      );
    }
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getFolderById(id);
    if (!existing) {
      return Response.json({ message: "文件夹不存在" }, { status: 404 });
    }

    const childFolders = await countChildFolders(id);
    const fileCount = await countFilesInFolder(id);
    if (childFolders > 0 || fileCount > 0) {
      return Response.json(
        {
          message: "文件夹非空，请先删除或移走其中的子文件夹与文件",
          childFolders,
          fileCount,
        },
        { status: 409 },
      );
    }

    await db.folder.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return Response.json({ message: "已删除" });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
