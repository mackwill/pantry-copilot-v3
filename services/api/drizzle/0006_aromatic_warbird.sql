ALTER TABLE "inventory_events" DROP CONSTRAINT "inventory_events_item_id_pantry_items_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_events" ALTER COLUMN "item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_events" ADD CONSTRAINT "inventory_events_item_id_pantry_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pantry_items"("id") ON DELETE set null ON UPDATE no action;