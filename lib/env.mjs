import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    /** 默认 embedding 模型 ID（默认 provider 下），如 openai/text-embedding-ada-002 */
    EMBEDDING_MODEL: z.string().default("openai/text-embedding-ada-002"),
    /** embedding 来源：openai=默认 gateway，qwen=通义/OpenAI 兼容接口 */
    EMBEDDING_PROVIDER: z.enum(["openai", "qwen"]).default("openai"),
    /** Qwen/通义 API Base URL（仅当 EMBEDDING_PROVIDER=qwen 时必填） */
    QWEN_BASE_URL: z.string().url().optional(),
    /** Qwen/通义 API Key（仅当 EMBEDDING_PROVIDER=qwen 时必填） */
    QWEN_API_KEY: z.string().optional(),
    /** Qwen embedding 模型名（仅当 EMBEDDING_PROVIDER=qwen 时使用），如 text-embedding-v3 */
    QWEN_EMBEDDING_MODEL: z.string().optional(),
  },
});
