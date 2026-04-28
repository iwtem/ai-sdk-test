import { Prisma } from "@prisma/client";
import { embed } from "ai";
import { embeddingProviderOptions, getEmbeddingModel } from "~/lib/ai/embedding";
import { db } from "~/lib/db";

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\n", " ");
  const model = getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: input,
    providerOptions: embeddingProviderOptions,
  });
  return embedding;
};

type SimilarGuide = { name: string; similarity: number };

export const findRelevantContent = async (userQuery: string): Promise<SimilarGuide[]> => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const vectorLiteral = `[${userQueryEmbedded.join(",")}]`;

  const rows = await db.$queryRaw<SimilarGuide[]>(Prisma.sql`
    SELECT
      content AS name,
      1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM embeddings
    WHERE 1 - (embedding <=> ${vectorLiteral}::vector) > 0.5
    ORDER BY similarity DESC
    LIMIT 4
  `);

  return rows;
};
