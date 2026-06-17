CREATE TABLE "recipe_tweaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"turn" integer NOT NULL,
	"user_message" text NOT NULL,
	"ai_summary" text NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "original_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "recipe_tweaks" ADD CONSTRAINT "recipe_tweaks_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tweaks" ADD CONSTRAINT "recipe_tweaks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_tweaks_recipe_turn_idx" ON "recipe_tweaks" USING btree ("recipe_id","turn");