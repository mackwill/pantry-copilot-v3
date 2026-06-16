import { COOK_SESSION_STATUSES } from '@pantry/contracts';
import { integer, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { recipes } from './recipes.js';

export const cookSessionStatus = pgEnum('cook_session_status', COOK_SESSION_STATUSES);

/**
 * A cook-along session. At most one `active` row per user (enforced by the
 * `cook.start` mutation, which abandons the prior active session). Timers are
 * client-side: only `currentStepIndex` + `startedAt` persist, so a killed app
 * resumes to the right step without per-second writes.
 */
export const cookSessions = pgTable('cook_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  status: cookSessionStatus('status').notNull().default('active'),
  currentStepIndex: integer('current_step_index').notNull().default(0),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
