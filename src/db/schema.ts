import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { user } from '@/db/auth-schema';
export const profile = sqliteTable('profile', {
  id: text('id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  telegram: text('telegram').notNull(),
  city: text('city'),
  bio: text('bio'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});
export type Profile = typeof profile.$inferSelect;
export type NewProfile = typeof profile.$inferInsert;
export const LISTING_KINDS = ['offer', 'request'] as const;
export type ListingKind = (typeof LISTING_KINDS)[number];
export const PRICE_MODES = ['fixed', 'hourly', 'negotiable', 'free'] as const;
export type PriceMode = (typeof PRICE_MODES)[number];
export const LISTING_STATUSES = ['active', 'closed', 'hidden'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export const listing = sqliteTable(
  'listing',
  {
    id: text('id').primaryKey(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: LISTING_KINDS }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    tags: text('tags').notNull().default(''),
    city: text('city'),
    priceMode: text('price_mode', { enum: PRICE_MODES }).notNull(),
    priceMin: real('price_min'),
    priceMax: real('price_max'),
    currency: text('currency').notNull().default('KZT'),
    priceSummary: text('price_summary'),
    status: text('status', { enum: LISTING_STATUSES }).notNull().default('active'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index('idx_listing_author').on(table.authorId),
    index('idx_listing_kind_status').on(table.kind, table.status),
    index('idx_listing_category').on(table.category),
    index('idx_listing_created').on(table.createdAt),
  ],
);
export type Listing = typeof listing.$inferSelect;
export type NewListing = typeof listing.$inferInsert;
export const engagement = sqliteTable(
  'engagement',
  {
    id: text('id').primaryKey(),
    listingId: text('listing_id')
      .notNull()
      .references(() => listing.id, { onDelete: 'cascade' }),
    ownerId: text('owner_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    counterpartId: text('counterpart_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('uniq_engagement_listing_pair').on(
      table.listingId,
      table.ownerId,
      table.counterpartId,
    ),
    index('idx_engagement_owner').on(table.ownerId),
    index('idx_engagement_counterpart').on(table.counterpartId),
  ],
);
export type Engagement = typeof engagement.$inferSelect;
export type NewEngagement = typeof engagement.$inferInsert;
export const review = sqliteTable(
  'review',
  {
    id: text('id').primaryKey(),
    engagementId: text('engagement_id')
      .notNull()
      .references(() => engagement.id, { onDelete: 'cascade' }),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    subjectId: text('subject_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    text: text('text'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    uniqueIndex('uniq_review_engagement_author').on(table.engagementId, table.authorId),
    index('idx_review_subject').on(table.subjectId),
  ],
);
export type Review = typeof review.$inferSelect;
export type NewReview = typeof review.$inferInsert;
export const profileRelations = relations(profile, ({ one }) => ({
  user: one(user, { fields: [profile.id], references: [user.id] }),
}));
export const listingRelations = relations(listing, ({ one, many }) => ({
  author: one(user, { fields: [listing.authorId], references: [user.id] }),
  engagements: many(engagement),
}));
export const engagementRelations = relations(engagement, ({ one, many }) => ({
  listing: one(listing, { fields: [engagement.listingId], references: [listing.id] }),
  owner: one(user, { fields: [engagement.ownerId], references: [user.id] }),
  counterpart: one(user, { fields: [engagement.counterpartId], references: [user.id] }),
  reviews: many(review),
}));
export const reviewRelations = relations(review, ({ one }) => ({
  engagement: one(engagement, { fields: [review.engagementId], references: [engagement.id] }),
  author: one(user, { fields: [review.authorId], references: [user.id] }),
  subject: one(user, { fields: [review.subjectId], references: [user.id] }),
}));
