import { type ImageScanResult, SCAN_STATUSES } from '@pantry/contracts';
import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.js';

export const scanStatus = pgEnum('scan_status', SCAN_STATUSES);

export const imageScans = pgTable('image_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: scanStatus('status').notNull(),
  // Raw image storage is deferred (M3 discards bytes after extraction).
  rawImageUrl: text('raw_image_url'),
  result: jsonb('result').$type<ImageScanResult>(),
  provider: text('provider'),
  model: text('model'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
});
