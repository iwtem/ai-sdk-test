import { z } from "zod";
import { errorResponse, successResponse } from "~/lib/api/response";
import { db } from "~/lib/db";
import { getFolderById, hasSiblingName } from "~/lib/folders/folder-service";

const listQuerySchema = z.object({
  parentId: z.string().optional(),
});

const createBodySchema = z.object({
  parentId: z.string().nullable().optional(),
  name: z.string().min(1).max(200),
});

function normalizeName(name: string) {
  return name.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParent = searchParams.get("parentId");
    const parsed = listQuerySchema.parse({
      parentId: rawParent === null ? undefined : rawParent,
    });

    const parentId =
      parsed.parentId === undefined || parsed.parentId === "" ? null : parsed.parentId;

    if (parentId) {
      const parent = await getFolderById(parentId);
      if (!parent) {
        return errorResponse("父文件夹不存在", 404);
      }
    }

    const items = await db.folder.findMany({
      where: {
        deletedAt: null,
        parentId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ items });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("查询参数无效", 400, 400, { errors: error.issues });
    }
    console.error("[folders GET]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBodySchema.parse(body);
    const name = normalizeName(parsed.name);
    if (!name) {
      return errorResponse("文件夹名称不能为空", 400);
    }

    const parentId =
      parsed.parentId === undefined || parsed.parentId === "" ? null : parsed.parentId;

    if (parentId) {
      const parent = await getFolderById(parentId);
      if (!parent) {
        return errorResponse("父文件夹不存在", 404);
      }
    }

    if (await hasSiblingName(parentId, name)) {
      return errorResponse("同级下已存在同名文件夹", 409);
    }

    const created = await db.folder.create({
      data: {
        parentId,
        name,
        createdBy: "当前用户",
      },
      select: {
        id: true,
        parentId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({ folder: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("请求体无效", 400, 400, { errors: error.issues });
    }
    console.error("[folders POST]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
