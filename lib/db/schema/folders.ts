import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { index, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { nanoid } from "~/lib/utils";

export const folders = pgTable(
  "folders",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    parentId: varchar("parent_id", { length: 191 }).references((): AnyPgColumn => folders.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    createdBy: varchar("created_by", { length: 191 }),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("folders_parent_id_idx").on(table.parentId),
    uniqueIndex("folders_parent_id_name_active_uidx")
      .on(table.parentId, table.name)
      .where(sql`${table.deletedAt} is null`),
  ],
);
