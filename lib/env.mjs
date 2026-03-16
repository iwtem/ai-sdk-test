import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    /** 对话模型 ID */
    CHAT_MODEL: z.string().default("qwen-plus"),
    /** 自定义对话接口 Base URL（OpenAI 兼容） */
    CHAT_BASE_URL: z
      .url()
      .default("https://dashscope.aliyuncs.com/compatible-mode/v1"),
    /** 自定义对话接口 API Key */
    CHAT_API_KEY: z.string(),

    /** embedding 模型 ID */
    EMBEDDING_MODEL: z.string().default("text-embedding-v4"),
    /** 自定义 embedding 接口 Base URL（OpenAI 兼容） */
    EMBEDDING_BASE_URL: z.url().optional(),
    /** 自定义 embedding 接口 API Key */
    EMBEDDING_API_KEY: z.string().optional(),
  },
});
