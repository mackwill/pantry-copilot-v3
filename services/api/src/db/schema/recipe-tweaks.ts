import type { RecipeChange } from '@pantry/contracts';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';
import { recipes } from './recipes.js';

/**
 * Append-only tweak lineage for a recipe (the audit log the chat thread
 * hydrates from — there is no separate job table). One row per applied tweak
 * turn, ordered by `turn` (1-based). `revert` deletes a recipe's rows and
 * restores `recipes.original_snapshot`.
 */
export const recipeTweaks = pgTable(
  'recipe_tweaks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    turn: integer('turn').notNull(),
    userMessage: text('user_message').notNull(),
    aiSummary: text('ai_summary').notNull(),
    changes: jsonb('changes').$type<RecipeChange[]>().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('recipe_tweaks_recipe_turn_idx').on(table.recipeId, table.turn)],
);
