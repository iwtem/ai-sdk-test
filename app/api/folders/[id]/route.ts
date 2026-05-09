import { z } from "zod";
import { errorResponse, successResponse } from "~/lib/api/response";
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
      return errorResponse("文件夹不存在", 404);
    }
    const breadcrumb = await buildBreadcrumb(id);
    return successResponse({
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
    console.error("[folders/:id GET]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getFolderById(id);
    if (!existing) {
      return errorResponse("文件夹不存在", 404);
    }

    const body = await request.json();
    const parsed = patchBodySchema.parse(body);

    let nextName = existing.name;
    let nextParentId: string | null = existing.parentId;

    if (parsed.name !== undefined) {
      const name = normalizeName(parsed.name);
      if (!name) {
        return errorResponse("文件夹名称不能为空", 400);
      }
      nextName = name;
    }

    if (parsed.parentId !== undefined) {
      nextParentId = parsed.parentId === "" || parsed.parentId === null ? null : parsed.parentId;
      if (nextParentId) {
        const parent = await getFolderById(nextParentId);
        if (!parent) {
          return errorResponse("目标父文件夹不存在", 404);
        }
      }
      if (await wouldCreateFolderCycle(id, nextParentId)) {
        return errorResponse("不能将文件夹移动到自身或其子文件夹下", 400);
      }
    }

    const finalName = nextName;
    const finalParentId = nextParentId;
    if (finalName !== existing.name || finalParentId !== existing.parentId) {
      if (await hasSiblingName(finalParentId, finalName, id)) {
        return errorResponse("同级下已存在同名文件夹", 409);
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

    return successResponse({ folder: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("请求体无效", 400, 400, { errors: error.issues });
    }
    console.error("[folders/:id PATCH]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = await getFolderById(id);
    if (!existing) {
      return errorResponse("文件夹不存在", 404);
    }

    const childFolders = await countChildFolders(id);
    const fileCount = await countFilesInFolder(id);
    if (childFolders > 0 || fileCount > 0) {
      return errorResponse("文件夹非空，请先删除或移走其中的子文件夹与文件", 409, 409, {
        childFolders,
        fileCount,
      });
    }

    await db.folder.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return successResponse({ ok: true }, "已删除");
  } catch (error) {
    console.error("[folders/:id DELETE]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
