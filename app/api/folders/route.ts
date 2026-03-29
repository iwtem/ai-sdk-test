import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { folders } from "~/lib/db/schema/folders";
import {
  getFolderById,
  hasSiblingName,
} from "~/lib/folders/folder-service";

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
        return Response.json({ message: "父文件夹不存在" }, { status: 404 });
      }
    }

    const items = await db
      .select({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
      })
      .from(folders)
      .where(
        and(
          isNull(folders.deletedAt),
          parentId === null ? isNull(folders.parentId) : eq(folders.parentId, parentId),
        ),
      )
      .orderBy(asc(folders.name));

    return Response.json({ items });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { message: "Invalid query params", errors: error.issues },
        { status: 400 },
      );
    }
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBodySchema.parse(body);
    const name = normalizeName(parsed.name);
    if (!name) {
      return Response.json({ message: "文件夹名称不能为空" }, { status: 400 });
    }

    const parentId =
      parsed.parentId === undefined || parsed.parentId === "" ? null : parsed.parentId;

    if (parentId) {
      const parent = await getFolderById(parentId);
      if (!parent) {
        return Response.json({ message: "父文件夹不存在" }, { status: 404 });
      }
    }

    if (await hasSiblingName(parentId, name)) {
      return Response.json({ message: "同级下已存在同名文件夹" }, { status: 409 });
    }

    const [created] = await db
      .insert(folders)
      .values({
        parentId,
        name,
        createdBy: "当前用户",
      })
      .returning({
        id: folders.id,
        parentId: folders.parentId,
        name: folders.name,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
      });

    return Response.json({ folder: created });
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
