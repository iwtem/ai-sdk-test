"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { generateEmbeddings } from "~/lib/ai/embedding";
import { db } from "~/lib/db";

const createResourceSchema = z.object({
  content: z.string().min(1),
});

export type NewResourceParams = z.infer<typeof createResourceSchema>;

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = createResourceSchema.parse(input);

    const message = await db.$transaction(async (tx) => {
      const resource = await tx.resource.create({
        data: { content },
        select: { id: true },
      });

      const embeddings = await generateEmbeddings(content);

      for (const item of embeddings) {
        const vectorLiteral = `[${item.embedding.join(",")}]`;
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO embeddings (id, resource_id, content, embedding)
          VALUES (${randomUUID()}, ${resource.id}, ${item.content}, ${vectorLiteral}::vector)
        `);
      }

      return "Resource successfully created with embeddings.";
    });

    return message;
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : "Error, please try again.";
  }
};
