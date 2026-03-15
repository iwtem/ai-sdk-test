import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { EmbeddingModel } from "ai";
import { embedMany } from "ai";
import { env } from "~/lib/env.mjs";

function getEmbeddingModel(): EmbeddingModel {
  if (env.EMBEDDING_PROVIDER === "qwen") {
    const baseURL = env.QWEN_BASE_URL;
    const apiKey = env.QWEN_API_KEY;
    const modelId = env.QWEN_EMBEDDING_MODEL;
    if (!baseURL || !apiKey || !modelId) {
      throw new Error(
        "当 EMBEDDING_PROVIDER=qwen 时需设置 QWEN_BASE_URL、QWEN_API_KEY、QWEN_EMBEDDING_MODEL",
      );
    }
    const qwen = createOpenAICompatible({
      baseURL,
      name: "qwen",
      apiKey,
    });
    return qwen.embeddingModel(modelId);
  }
  return env.EMBEDDING_MODEL;
}

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const model = getEmbeddingModel();
  const { embeddings } = await embedMany({
    model,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
