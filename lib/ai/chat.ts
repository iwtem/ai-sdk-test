import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { env } from "~/lib/env.mjs";

export function getChatModel(): LanguageModel {
  const baseURL = env.CHAT_BASE_URL;
  if (baseURL) {
    const apiKey = env.CHAT_API_KEY;
    if (!apiKey) {
      throw new Error("设置 CHAT_BASE_URL 时需同时设置 CHAT_API_KEY");
    }
    const provider = createOpenAICompatible({
      baseURL,
      name: "chat",
      apiKey,
    });
    return provider.chatModel(env.CHAT_MODEL);
  }
  return env.CHAT_MODEL;
}
