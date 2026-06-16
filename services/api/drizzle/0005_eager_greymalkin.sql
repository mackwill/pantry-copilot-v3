CREATE TYPE "public"."cook_session_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
ALTER TYPE "public"."inventory_event_kind" ADD VALUE 'consumed';--> statement-breakpoint
CREATE TABLE "cook_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"status" "cook_session_status" DEFAULT 'active' NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cook_sessions" ADD CONSTRAINT "cook_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cook_sessions" ADD CONSTRAINT "cook_sessions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;