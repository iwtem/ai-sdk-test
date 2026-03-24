import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";

const querySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["uploaded", "indexing", "ready", "failed", "deleted"]).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    });

    const conditions = [isNull(files.deletedAt)];
    if (parsed.q) {
      conditions.push(ilike(files.name, `%${parsed.q}%`));
    }
    if (parsed.status) {
      conditions.push(eq(files.status, parsed.status));
    }

    const where = and(...conditions);

    const [items, [statsRow], [weekRow]] = await Promise.all([
      db.select().from(files).where(where).orderBy(desc(files.createdAt)).limit(100),
      db
        .select({
          totalCount: sql<number>`count(*)::int`,
          totalSize: sql<number>`coalesce(sum(${files.sizeBytes}), 0)::int`,
        })
        .from(files)
        .where(where),
      db
        .select({
          weeklyUploaded: sql<number>`count(*)::int`,
        })
        .from(files)
        .where(
          and(
            isNull(files.deletedAt),
            sql`${files.createdAt} >= now() - interval '7 days'`,
          ),
        ),
    ]);

    return Response.json({
      items,
      stats: {
        totalCount: statsRow?.totalCount ?? 0,
        totalSize: statsRow?.totalSize ?? 0,
        weeklyUploaded: weekRow?.weeklyUploaded ?? 0,
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
