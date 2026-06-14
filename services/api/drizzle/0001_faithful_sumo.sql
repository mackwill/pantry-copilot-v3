CREATE TYPE "public"."inventory_event_kind" AS ENUM('added', 'edited', 'removed', 'adjusted');--> statement-breakpoint
CREATE TYPE "public"."pantry_category" AS ENUM('produce', 'dairy', 'pantry', 'protein', 'freezer', 'drinks', 'treats');--> statement-breakpoint
CREATE TYPE "public"."pantry_location" AS ENUM('fridge_top', 'fridge_door', 'fridge_crisper', 'freezer', 'pantry_upper', 'pantry_lower', 'counter');--> statement-breakpoint
CREATE TYPE "public"."pantry_unit" AS ENUM('ea', 'g', 'kg', 'lb', 'oz', 'cup', 'tbsp', 'tsp', 'gallon', 'stick', 'pack', 'jar', 'tin', 'bottle', 'bunch', 'head', 'bag');--> statement-breakpoint
CREATE TABLE "inventory_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "inventory_event_kind" NOT NULL,
	"quantity_delta" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pantry_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"quantity" numeric(10, 2) NOT NULL,
	"unit" "pantry_unit" NOT NULL,
	"category" "pantry_category" NOT NULL,
	"location" "pantry_location" NOT NULL,
	"purchased_at" text,
	"best_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_item_id_pantry_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pantry_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;