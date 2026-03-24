DO $$ BEGIN
	CREATE TYPE "public"."file_job_status" AS ENUM('pending', 'running', 'succeeded', 'failed');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."file_job_type" AS ENUM('parse', 'index', 'embedding');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."file_status" AS ENUM('uploaded', 'indexing', 'ready', 'failed', 'deleted');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"resource_id" varchar(191),
	"content" text NOT NULL,
	"embedding" vector(1536) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_jobs" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"file_id" varchar(191) NOT NULL,
	"job_type" "file_job_type" NOT NULL,
	"status" "file_job_status" DEFAULT 'pending' NOT NULL,
	"attempts" bigint DEFAULT 0 NOT NULL,
	"error_message" text,
	"payload" text,
	"started_at" timestamp,
	"finished_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"ext" varchar(32) DEFAULT '' NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"storage_provider" varchar(32) DEFAULT 'minio' NOT NULL,
	"bucket" varchar(128) NOT NULL,
	"storage_key" text NOT NULL,
	"checksum_sha256" varchar(64),
	"status" "file_status" DEFAULT 'uploaded' NOT NULL,
	"created_by" varchar(191),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "file_jobs" ADD CONSTRAINT "file_jobs_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_jobs_file_id_idx" ON "file_jobs" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "file_jobs_status_idx" ON "file_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_status_idx" ON "files" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_created_at_idx" ON "files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_name_idx" ON "files" USING btree ("name");