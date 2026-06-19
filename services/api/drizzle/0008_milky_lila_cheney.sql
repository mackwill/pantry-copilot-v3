CREATE TYPE "public"."sub_state" AS ENUM('none', 'active', 'cancelled', 'expired', 'in_grace_period', 'in_billing_retry', 'paused', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'basic', 'pro');--> statement-breakpoint
CREATE TABLE "revenuecat_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"app_user_id" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "top_up_credit_consumptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_kind" text NOT NULL,
	"amount" integer DEFAULT 1 NOT NULL,
	"source_table" text,
	"source_id" text,
	"consumed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "top_up_credit_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_event_id" text NOT NULL,
	"amount" integer NOT NULL,
	"product_identifier" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"rc_app_user_id" text NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"is_pro" boolean DEFAULT false NOT NULL,
	"product_identifier" text,
	"period_type" text,
	"expires_at" timestamp,
	"will_renew" boolean DEFAULT false NOT NULL,
	"store" text,
	"top_up_credits" integer DEFAULT 0 NOT NULL,
	"sub_state" "sub_state" DEFAULT 'none' NOT NULL,
	"in_grace_period" boolean DEFAULT false NOT NULL,
	"raw" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "top_up_credit_consumptions" ADD CONSTRAINT "top_up_credit_consumptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_up_credit_grants" ADD CONSTRAINT "top_up_credit_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "top_up_credit_consumptions_user_idx" ON "top_up_credit_consumptions" USING btree ("user_id","consumed_at");--> statement-breakpoint
CREATE INDEX "top_up_credit_grants_user_idx" ON "top_up_credit_grants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "top_up_credit_grants_source_event_idx" ON "top_up_credit_grants" USING btree ("source_event_id");