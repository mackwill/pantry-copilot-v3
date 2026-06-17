import { type AIRecipe, type GenerationRequest, RECIPE_DIFFICULTIES } from '@pantry/contracts';
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const recipeDifficulty = pgEnum('recipe_difficulty', RECIPE_DIFFICULTIES);
export const recipeJobStatus = pgEnum('recipe_job_status', ['streaming', 'succeeded', 'failed', 'aborted']);

/** A persisted recipe — written once on the stream's `done` event. */
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  weirdness: integer('weirdness').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  /** The full AI recipe body — mutated in place as the co-pilot tweaks it. */
  data: jsonb('data').$type<AIRecipe>().notNull(),
  /** Tweak version: 1 untweaked, +1 per applied tweak (board `v3` pill). */
  version: integer('version').notNull().default(1),
  /** Frozen pre-tweak recipe, captured on the first tweak; `revert` restores it. */
  originalSnapshot: jsonb('original_snapshot').$type<AIRecipe>(),
  provider: text('provider'),
  model: text('model'),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** One generation attempt — the audit/lifecycle row for a stream. */
export const recipeGenerationJobs = pgTable('recipe_generation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  request: jsonb('request').$type<GenerationRequest>().notNull(),
  status: recipeJobStatus('status').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
