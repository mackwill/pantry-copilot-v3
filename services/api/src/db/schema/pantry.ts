import { numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  INVENTORY_EVENT_KINDS, PANTRY_CATEGORIES, PANTRY_LOCATIONS, PANTRY_UNITS,
} from '@pantry/contracts';
import { users } from './auth.js';

export const pantryCategory = pgEnum('pantry_category', PANTRY_CATEGORIES);
export const pantryLocation = pgEnum('pantry_location', PANTRY_LOCATIONS);
export const pantryUnit = pgEnum('pantry_unit', PANTRY_UNITS);
export const inventoryEventKind = pgEnum('inventory_event_kind', INVENTORY_EVENT_KINDS);

export const pantryItems = pgTable('pantry_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brand: text('brand'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  unit: pantryUnit('unit').notNull(),
  category: pantryCategory('category').notNull(),
  location: pantryLocation('location').notNull(),
  purchasedAt: text('purchased_at'), // ISO YYYY-MM-DD
  bestBy: text('best_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});

export const inventoryEvents = pgTable('inventory_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => pantryItems.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: inventoryEventKind('kind').notNull(),
  quantityDelta: numeric('quantity_delta', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
