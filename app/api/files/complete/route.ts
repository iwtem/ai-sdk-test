import { z } from "zod";
import { db } from "~/lib/db";
import { fileJobs, files } from "~/lib/db/schema/files";
import { env } from "~/lib/env.mjs";

const requestSchema = z.object({
  name: z.string().min(1),
  mimeType: z.string().default("application/octet-stream"),
  sizeBytes: z.number().int().nonnegative(),
  storageKey: z.string().min(1),
  checksumSha256: z.string().length(64).optional(),
  createdBy: z.string().optional(),
});

const extractExt = (name: string) => {
  const index = name.lastIndexOf(".");
  if (index <= 0) return "";
  return name.slice(index + 1).toLowerCase();
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);

    if (!env.S3_BUCKET) {
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
          bucket: env.S3_BUCKET,
          storageKey: parsed.storageKey,
          checksumSha256: parsed.checksumSha256,
          createdBy: parsed.createdBy,
          status: "uploaded",
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
