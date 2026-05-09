import { GetObjectCommand } from "@aws-sdk/client-s3";
import { errorResponse } from "~/lib/api/response";
import { db } from "~/lib/db";
import { env } from "~/lib/env";
import { getS3Client } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return errorResponse("缺少文件 id", 400);
    }

    const file = await db.file.findFirst({
      where: { id, deletedAt: null },
      select: {
        storageKey: true,
        name: true,
        mimeType: true,
      },
    });

    if (!file) {
      return errorResponse("文件不存在", 404);
    }

    const client = getS3Client();
    const object = await client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET as string,
        Key: file.storageKey,
      }),
    );

    if (!object.Body) {
      return errorResponse("文件内容不存在", 404);
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
    console.error("[onlyoffice/files/:id]", error);
    return errorResponse("服务器异常，请稍后重试。", 500);
  }
}
