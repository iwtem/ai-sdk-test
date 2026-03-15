import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import "dotenv/config";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    /** embedding 模型 ID；未设置 BASE_URL 时走默认 gateway（如 openai/xxx），设置了则用自定义接口 */
    EMBEDDING_MODEL: z.string().default("openai/text-embedding-ada-002"),
    /** 自定义 embedding 接口 Base URL（OpenAI 兼容）；设了则用 EMBEDDING_API_KEY + EMBEDDING_MODEL */
    EMBEDDING_BASE_URL: z.url().optional(),
    /** 自定义 embedding 接口 API Key（仅当 EMBEDDING_BASE_URL 设置时必填） */
    EMBEDDING_API_KEY: z.string().optional(),
    /** 对话模型 ID；未设置 BASE_URL 时走默认 gateway，设置了则用自定义接口 */
    CHAT_MODEL: z.string().default("openai/gpt-4o-mini"),
    /** 自定义对话接口 Base URL（OpenAI 兼容）；设了则用 CHAT_API_KEY + CHAT_MODEL */
    CHAT_BASE_URL: z.url().optional(),
    /** 自定义对话接口 API Key（仅当 CHAT_BASE_URL 设置时必填） */
    CHAT_API_KEY: z.string().optional(),
  },
});
