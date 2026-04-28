import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "~/lib/db";
import { getFolderById } from "~/lib/folders/folder-service";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["uploaded", "indexing", "ready", "failed", "deleted"]).optional(),
  folderId: z.string().optional(),
  trash: z.enum(["true", "1", "false", "0"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["name", "updatedAt", "createdAt", "size"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

function sortColumn(sort: z.infer<typeof querySchema>["sort"]): keyof Prisma.FileOrderByWithRelationInput {
  switch (sort) {
    case "name":
      return "name";
    case "updatedAt":
      return "updatedAt";
    case "size":
      return "sizeBytes";
    default:
      return "createdAt";
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      folderId: searchParams.get("folderId") ?? undefined,
      trash: searchParams.get("trash") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });

    const trashOnly =
      parsed.trash === "true" || parsed.trash === "1";

    const folderIdParam =
      parsed.folderId === undefined || parsed.folderId === "" ? null : parsed.folderId;

    if (!trashOnly && folderIdParam) {
      const folder = await getFolderById(folderIdParam);
      if (!folder) {
        return Response.json({ message: "文件夹不存在" }, { status: 404 });
      }
    }

    const where: Prisma.FileWhereInput = {
      deletedAt: trashOnly ? { not: null } : null,
    };
    if (folderIdParam) {
      where.folderId = folderIdParam;
    } else if (!trashOnly) {
      where.folderId = null;
    }
    if (parsed.q) {
      where.name = { contains: parsed.q, mode: "insensitive" };
    }
    if (parsed.status) {
      where.status = parsed.status;
    }

    const limit = parsed.limit;
    const offset = parsed.offset;
    const orderBy = { [sortColumn(parsed.sort)]: parsed.order } as Prisma.FileOrderByWithRelationInput;

    const [items, totalCount, sizeAgg, weeklyUploaded] = await Promise.all([
      db.file.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.file.count({ where }),
      db.file.aggregate({
        where,
        _sum: { sizeBytes: true },
      }),
      db.file.count({
        where: {
          ...where,
          ...(trashOnly
            ? {
                deletedAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              }
            : {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              }),
        },
      }),
    ]);

    return Response.json({
      items,
      stats: {
        totalCount,
        totalSize: sizeAgg._sum.sizeBytes ?? 0,
        weeklyUploaded,
      },
      page: {
        limit,
        offset,
        hasMore: offset + items.length < totalCount,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          message: "Invalid query params",
          errors: error.issues,
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
