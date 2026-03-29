import { and, asc, desc, eq, ilike, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
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

function sortColumn(sort: z.infer<typeof querySchema>["sort"]) {
  switch (sort) {
    case "name":
      return files.name;
    case "updatedAt":
      return files.updatedAt;
    case "size":
      return files.sizeBytes;
    default:
      return files.createdAt;
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

    const conditions = trashOnly ? [isNotNull(files.deletedAt)] : [isNull(files.deletedAt)];

    if (folderIdParam) {
      conditions.push(eq(files.folderId, folderIdParam));
    } else if (!trashOnly) {
      conditions.push(isNull(files.folderId));
    }

    if (parsed.q) {
      conditions.push(ilike(files.name, `%${parsed.q}%`));
    }
    if (parsed.status) {
      conditions.push(eq(files.status, parsed.status));
    }

    const where = and(...conditions);
    const col = sortColumn(parsed.sort);
    const orderFn = parsed.order === "asc" ? asc : desc;

    const limit = parsed.limit;
    const offset = parsed.offset;

    const [items, [statsRow], [weekRow]] = await Promise.all([
      db
        .select()
        .from(files)
        .where(where)
        .orderBy(orderFn(col))
        .limit(limit)
        .offset(offset),
      db
        .select({
          totalCount: sql<number>`count(*)::int`,
          totalSize: sql<number>`coalesce(sum(${files.sizeBytes}), 0)::int`,
        })
        .from(files)
        .where(where),
      trashOnly
        ? db
            .select({
              weeklyUploaded: sql<number>`count(*)::int`,
            })
            .from(files)
            .where(
              and(
                where,
                sql`${files.deletedAt} >= now() - interval '7 days'`,
              ),
            )
        : db
            .select({
              weeklyUploaded: sql<number>`count(*)::int`,
            })
            .from(files)
            .where(
              and(
                where,
                sql`${files.createdAt} >= now() - interval '7 days'`,
              ),
            ),
    ]);

    const totalCount = statsRow?.totalCount ?? 0;

    return Response.json({
      items,
      stats: {
        totalCount,
        totalSize: statsRow?.totalSize ?? 0,
        weeklyUploaded: weekRow?.weeklyUploaded ?? 0,
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
