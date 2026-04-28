import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    /** 对话模型 ID */
    CHAT_MODEL: z.string().default("qwen-plus"),
    /** 自定义对话接口 Base URL（OpenAI 兼容） */
    CHAT_BASE_URL: z.url().default("https://dashscope.aliyuncs.com/compatible-mode/v1"),
    /** 自定义对话接口 API Key */
    CHAT_API_KEY: z.string(),

    /** S3 兼容存储 Endpoint（本地 MinIO 示例：http://127.0.0.1:9000） */
    S3_ENDPOINT: z.url().optional().default("http://127.0.0.1:9000"),
    /** S3 区域 */
    S3_REGION: z.string().optional().default("us-east-1"),
    /** S3 Access Key */
    S3_ACCESS_KEY: z.string().optional(),
    /** S3 Secret Key */
    S3_SECRET_KEY: z.string().optional(),
    /** S3 Bucket 名称 */
    S3_BUCKET: z.string().optional(),
    /** MinIO 一般需要 path-style 访问 */
    S3_FORCE_PATH_STYLE: z
      .string()
      .transform((value) => value === "true")
      .optional()
      .default(true),

    /** ONLYOFFICE DocumentServer 访问地址（浏览器侧） */
    ONLYOFFICE_URL: z.url().default("http://127.0.0.1:8082"),
    /** ONLYOFFICE 容器访问 Next 应用的地址（用于文档流读取） */
    APP_INTERNAL_URL: z.url().default("http://host.docker.internal:3006"),
  },
  experimental__runtimeEnv: {},
});
