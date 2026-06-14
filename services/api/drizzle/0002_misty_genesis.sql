CREATE TYPE "public"."scan_status" AS ENUM('processing', 'succeeded', 'failed', 'confirmed');--> statement-breakpoint
CREATE TABLE "image_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "scan_status" NOT NULL,
	"raw_image_url" text,
	"result" jsonb,
	"provider" text,
	"model" text,
	"tokens_input" integer,
	"tokens_output" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_scans" ADD CONSTRAINT "image_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;