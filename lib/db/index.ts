import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { pagination } from "prisma-extension-pagination";

import { env } from "../env";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const db = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
}).$extends(
  pagination({
    pages: { limit: 10, includePageCount: true },
  }),
);
