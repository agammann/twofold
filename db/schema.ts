import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const publicUsage = sqliteTable('public_usage', {
  id: integer('id').primaryKey(),
  day: text('day').notNull(),
  used: integer('used').notNull(),
  lastStarted: integer('last_started').notNull(),
});
