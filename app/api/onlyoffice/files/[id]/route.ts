import { GetObjectCommand } from "@aws-sdk/client-s3";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { env } from "~/lib/env";
import { getS3Client } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const [file] = await db
      .select({
        storageKey: files.storageKey,
        name: files.name,
        mimeType: files.mimeType,
      })
      .from(files)
      .where(and(eq(files.id, id), isNull(files.deletedAt)));

    if (!file) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const client = getS3Client();
    const object = await client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET as string,
        Key: file.storageKey,
      }),
    );

    if (!object.Body) {
      return Response.json({ message: "文件内容不存在" }, { status: 404 });
    }

    const body = object.Body.transformToWebStream();
    return new Response(body, {
      headers: {
        "Content-Type": object.ContentType || file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
