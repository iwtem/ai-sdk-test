import { z } from "zod";
import { createUploadSignedUrl } from "~/lib/storage/s3";
import { nanoid } from "~/lib/utils";

const requestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().default("application/octet-stream"),
});

const sanitizeFileName = (name: string) =>
  name
    .replaceAll(/[^a-zA-Z0-9._-]/g, "_")
    .replaceAll(/_{2,}/g, "_")
    .slice(0, 120);

const getDatePrefix = () => {
  const now = new Date();
  const yyyy = `${now.getFullYear()}`;
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  return `${yyyy}/${mm}/${dd}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    const safeName = sanitizeFileName(parsed.fileName);
    const storageKey = `${getDatePrefix()}/${nanoid()}-${safeName}`;

    const result = await createUploadSignedUrl({
      key: storageKey,
      contentType: parsed.fileType,
    });

    return Response.json(result);
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
