import { and, eq, isNull } from "drizzle-orm";
import { db } from "~/lib/db";
import { files } from "~/lib/db/schema/files";
import { getObjectByKey } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const [file] = await db
      .select({
        name: files.name,
        storageKey: files.storageKey,
        mimeType: files.mimeType,
      })
      .from(files)
      .where(and(eq(files.id, id), isNull(files.deletedAt)));

    if (!file) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const object = await getObjectByKey(file.storageKey);
    if (!object.Body) {
      return Response.json({ message: "文件内容为空" }, { status: 404 });
    }

    const safeName = file.name.replaceAll(/["\\]/g, "_");
    const asciiName = safeName.replaceAll(/[^\x20-\x7E]/g, "_");
    const encodedName = encodeURIComponent(safeName);
    const contentType = object.ContentType || file.mimeType || "application/octet-stream";
    const contentLength = object.ContentLength;

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "no-store",
    });

    if (contentLength !== undefined) {
      headers.set("Content-Length", String(contentLength));
    }

    return new Response(object.Body.transformToWebStream(), {
      status: 200,
      headers,
    });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
