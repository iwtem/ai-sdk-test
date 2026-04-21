import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/lib/env";

const ensureS3Env = () => {
  if (!env.S3_ENDPOINT) throw new Error("S3_ENDPOINT is not configured");
  if (!env.S3_REGION) throw new Error("S3_REGION is not configured");
  if (!env.S3_ACCESS_KEY) throw new Error("S3_ACCESS_KEY is not configured");
  if (!env.S3_SECRET_KEY) throw new Error("S3_SECRET_KEY is not configured");
  if (!env.S3_BUCKET) throw new Error("S3_BUCKET is not configured");
};

export const getS3Client = () => {
  ensureS3Env();
  const region = env.S3_REGION as string;
  const endpoint = env.S3_ENDPOINT as string;
  const accessKeyId = env.S3_ACCESS_KEY as string;
  const secretAccessKey = env.S3_SECRET_KEY as string;

  return new S3Client({
    region,
    endpoint,
    forcePathStyle: env.S3_FORCE_PATH_STYLE ?? true,
    credentials: { accessKeyId, secretAccessKey },
  });
};

export const createUploadSignedUrl = async ({
  key,
  contentType,
  expiresIn = 60 * 15,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}) => {
  ensureS3Env();
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return {
    uploadUrl,
    bucket: env.S3_BUCKET as string,
    key,
    expiresIn,
  };
};

export const createDownloadSignedUrl = async ({
  key,
  fileName,
  expiresIn = 60 * 15,
}: {
  key: string;
  fileName: string;
  expiresIn?: number;
}) => {
  ensureS3Env();
  const client = getS3Client();
  const safeName = fileName.replaceAll(/["\\]/g, "_");
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${safeName}"`,
  });
  const downloadUrl = await getSignedUrl(client, command, { expiresIn });
  return { downloadUrl, expiresIn };
};

export const deleteObjectByKey = async (key: string) => {
  ensureS3Env();
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
};
