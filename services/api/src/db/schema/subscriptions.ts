import { SUB_STATES, SUBSCRIPTION_TIERS } from '@pantry/contracts';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const subscriptionTier = pgEnum('subscription_tier', SUBSCRIPTION_TIERS);
export const subState = pgEnum('sub_state', SUB_STATES);

/** Server-authoritative entitlement mirror. Canonical source = RC webhooks. */
export const userSubscriptions = pgTable('user_subscriptions', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  rcAppUserId: text('rc_app_user_id').notNull(),
  tier: subscriptionTier('tier').notNull().default('free'),
  isPro: boolean('is_pro').notNull().default(false),
  productIdentifier: text('product_identifier'),
  periodType: text('period_type'),
  expiresAt: timestamp('expires_at'),
  willRenew: boolean('will_renew').notNull().default(false),
  store: text('store'),
  /** Cached balance = sum(grants) − sum(consumptions); ledger is the source of truth. */
  topUpCredits: integer('top_up_credits').notNull().default(0),
  subState: subState('sub_state').notNull().default('none'),
  inGracePeriod: boolean('in_grace_period').notNull().default(false),
  raw: jsonb('raw').$type<Record<string, unknown>>(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

/** RC retries webhooks up to 3× and may double-deliver — dedupe on event.id. */
export const revenuecatWebhookEvents = pgTable('revenuecat_webhook_events', {
  eventId: text('event_id').primaryKey(),
  type: text('type').notNull(),
  appUserId: text('app_user_id').notNull(),
  receivedAt: timestamp('received_at').notNull().defaultNow(),
});

export const topUpCreditGrants = pgTable(
  'top_up_credit_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    /** RC `event.id` of the NON_RENEWING_PURCHASE that produced this grant. */
    sourceEventId: text('source_event_id').notNull(),
    amount: integer('amount').notNull(),
    productIdentifier: text('product_identifier'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('top_up_credit_grants_user_idx').on(t.userId),
    uniqueIndex('top_up_credit_grants_source_event_idx').on(t.sourceEventId),
  ],
);

export const topUpCreditConsumptions = pgTable(
  'top_up_credit_consumptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    actionKind: text('action_kind').notNull(),
    amount: integer('amount').notNull().default(1),
    sourceTable: text('source_table'),
    sourceId: text('source_id'),
    consumedAt: timestamp('consumed_at').notNull().defaultNow(),
  },
  (t) => [
    index('top_up_credit_consumptions_user_idx').on(t.userId, t.consumedAt),
  ],
);
