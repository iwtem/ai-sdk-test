import { z } from "zod";
import { db } from "~/lib/db";
import { fileJobs, files } from "~/lib/db/schema/files";
import { env } from "~/lib/env.mjs";
import {
  DOCUMENT_UPLOAD_REJECT_MESSAGE,
  isDocumentUploadAllowed,
} from "~/lib/files/document-upload-allowed";
import { extractExt } from "~/lib/files/extract-ext";
import { getFolderById } from "~/lib/folders/folder-service";

const requestSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  sizeBytes: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
  checksumSha256: z.string().length(64).optional(),
  createdBy: z.string().optional(),
  folderId: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    if (!isDocumentUploadAllowed(parsed.name, parsed.mimeType)) {
      return Response.json({ message: DOCUMENT_UPLOAD_REJECT_MESSAGE }, { status: 415 });
    }

    const folderId =
      parsed.folderId === undefined || parsed.folderId === "" ? null : parsed.folderId;
    if (folderId) {
      const folder = await getFolderById(folderId);
      if (!folder) {
        return Response.json({ message: "文件夹不存在" }, { status: 404 });
      }
    }

    const bucket = env.S3_BUCKET;
    if (!bucket) {
      return Response.json({ message: "S3_BUCKET is not configured" }, { status: 500 });
    }

    const created = await db.transaction(async (tx) => {
      const [file] = await tx
        .insert(files)
        .values({
          name: parsed.name,
          ext: extractExt(parsed.name),
          mimeType: parsed.mimeType,
          sizeBytes: parsed.sizeBytes,
          bucket,
          storageKey: parsed.storageKey,
          checksumSha256: parsed.checksumSha256,
          createdBy: parsed.createdBy,
          status: "uploaded",
          folderId: folderId ?? undefined,
        })
        .returning();

      await tx.insert(fileJobs).values({
        fileId: file.id,
        jobType: "index",
        status: "pending",
      });

      return file;
    });

    return Response.json({
      message: "File metadata stored successfully",
      file: created,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          message: "Invalid request payload",
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
