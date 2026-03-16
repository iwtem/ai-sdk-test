import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ProviderOptions } from "@ai-sdk/provider-utils";
import type { EmbeddingModel } from "ai";
import { embedMany } from "ai";
import { env } from "~/lib/env.mjs";

export function getEmbeddingModel(): EmbeddingModel {
  const baseURL = env.EMBEDDING_BASE_URL || env.CHAT_BASE_URL;
  if (baseURL) {
    const apiKey = env.EMBEDDING_API_KEY || env.CHAT_API_KEY;
    if (!apiKey) {
      throw new Error("设置 EMBEDDING_BASE_URL 时需同时设置 EMBEDDING_API_KEY");
    }
    const provider = createOpenAICompatible({
      baseURL,
      name: "embedding",
      apiKey,
    });
    return provider.embeddingModel(env.EMBEDDING_MODEL);
  }
  return env.EMBEDDING_MODEL;
}

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const embeddingProviderOptions: ProviderOptions = {
  embedding: { dimensions: 1536 },
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: chunks,
    providerOptions: embeddingProviderOptions,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
