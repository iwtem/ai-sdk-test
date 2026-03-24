import { sql } from "drizzle-orm";
import { bigint, index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod";
import { nanoid } from "~/lib/utils";

export const fileStatusEnum = pgEnum("file_status", [
  "uploaded",
  "indexing",
  "ready",
  "failed",
  "deleted",
]);

export const fileJobTypeEnum = pgEnum("file_job_type", ["parse", "index", "embedding"]);

export const fileJobStatusEnum = pgEnum("file_job_status", [
  "pending",
  "running",
  "succeeded",
  "failed",
]);

export const files = pgTable(
  "files",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    ext: varchar("ext", { length: 32 }).notNull().default(""),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull().default("minio"),
    bucket: varchar("bucket", { length: 128 }).notNull(),
    storageKey: text("storage_key").notNull(),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    status: fileStatusEnum("status").notNull().default("uploaded"),
    createdBy: varchar("created_by", { length: 191 }),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("files_status_idx").on(table.status),
    index("files_created_at_idx").on(table.createdAt),
    index("files_name_idx").on(table.name),
  ],
);

export const fileJobs = pgTable(
  "file_jobs",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    fileId: varchar("file_id", { length: 191 })
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    jobType: fileJobTypeEnum("job_type").notNull(),
    status: fileJobStatusEnum("status").notNull().default("pending"),
    attempts: bigint("attempts", { mode: "number" }).notNull().default(0),
    errorMessage: text("error_message"),
    payload: text("payload"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
  },
  (table) => [
    index("file_jobs_file_id_idx").on(table.fileId),
    index("file_jobs_status_idx").on(table.status),
  ],
);

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type NewFileParams = z.infer<typeof insertFileSchema>;
