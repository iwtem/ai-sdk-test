import { db } from "~/lib/db";
import { createDownloadSignedUrl } from "~/lib/storage/s3";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return Response.json({ message: "缺少文件 id" }, { status: 400 });
    }

    const file = await db.file.findFirst({
      where: { id, deletedAt: null },
      select: {
        storageKey: true,
        name: true,
      },
    });

    if (!file) {
      return Response.json({ message: "文件不存在" }, { status: 404 });
    }

    const { downloadUrl, expiresIn } = await createDownloadSignedUrl({
      key: file.storageKey,
      fileName: file.name,
    });

    return Response.json({ downloadUrl, expiresIn });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
