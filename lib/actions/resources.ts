"use server";

import { generateEmbeddings } from "~/lib/ai/embedding";
import { db } from "~/lib/db";
import { embeddings as embeddingsTable } from "~/lib/db/schema/embeddings";
import {
  insertResourceSchema,
  type NewResourceParams,
  resources,
} from "~/lib/db/schema/resources";

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning();
    const embeddings = await generateEmbeddings(content);
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        content: embedding.content,
        embedding: embedding.embedding,
      })),
    );

    return "Resource successfully created with embeddings.";
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : "Error, please try again.";
  }
};
