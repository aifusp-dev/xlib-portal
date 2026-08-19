import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Roles: 'user' (por defecto, puede publicar pero queda pendiente de
 * revisión), 'verificador' (puede aprobar/rechazar envíos), 'admin' (además
 * puede conceder el rol verificador). No se usa un enum de Postgres a
 * propósito: añadir un rol nuevo no debe requerir una migración de tipo.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  googleSub: text('google_sub').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * pluginEditor coincide con el union type `PluginEditor` de
 * src/app/studio/page.tsx ('xfoods' | 'xcrops' | 'xmachines' | 'xpods' |
 * 'xautomation'). Se guarda como texto libre, no un enum de Postgres, para
 * que añadir un plugin nuevo al Studio no requiera tocar el esquema de la DB.
 *
 * `bundle` es el mismo zip que produce generateZIP() en src/lib/studio.ts,
 * acotado a una sola entrada (ver src/lib/preset-bundle.ts).
 */
export const presets = pgTable('presets', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  pluginEditor: text('plugin_editor').notNull(),
  itemId: text('item_id').notNull(),
  bundle: text('bundle').notNull(), // base64 del zip; ver nota en preset-bundle.ts
  bundleSize: integer('bundle_size').notNull(),
  status: text('status').notNull().default('pending'), // pending | approved | rejected
  authorId: uuid('author_id').notNull().references(() => users.id),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewNote: text('review_note'),
  installCount: integer('install_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
