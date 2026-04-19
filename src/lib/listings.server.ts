import { env } from 'cloudflare:workers';
import { and, desc, eq, like, or, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { listing, profile, type Listing } from '@/db/schema';
import {
  buildPriceSummary,
  tagsFromInput,
  type ListingInput,
  type BrowseFilters,
} from '@/lib/validation';
interface AppEnv {
  DB: D1Database;
}
function getAppDb() {
  const appEnv = env as unknown as AppEnv;
  return getDb(appEnv.DB);
}
export type ListingWithAuthor = Listing & {
  author: {
    id: string;
    displayName: string;
    city: string | null;
    telegram: string;
  } | null;
};
function newId(): string {
  return crypto.randomUUID();
}
export async function createListing(authorId: string, input: ListingInput): Promise<string> {
  const db = getAppDb();
  const id = newId();
  const currency = input.currency ?? 'KZT';
  const summary = buildPriceSummary(input.priceMode, input.priceMin, input.priceMax, currency);
  await db.insert(listing).values({
    id,
    authorId,
    kind: input.kind,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: tagsFromInput(input.tags),
    city: input.city ?? null,
    priceMode: input.priceMode,
    priceMin: input.priceMin ?? null,
    priceMax: input.priceMax ?? null,
    currency,
    priceSummary: summary ?? null,
    status: 'active',
  });
  return id;
}
export async function updateListing(
  authorId: string,
  id: string,
  input: ListingInput,
): Promise<void> {
  const db = getAppDb();
  const existing = await db.query.listing.findFirst({ where: eq(listing.id, id) });
  if (!existing) throw new Error('listing.notFound');
  if (existing.authorId !== authorId) throw new Error('listing.forbidden');
  const currency = input.currency ?? 'KZT';
  const summary = buildPriceSummary(input.priceMode, input.priceMin, input.priceMax, currency);
  await db
    .update(listing)
    .set({
      kind: input.kind,
      title: input.title,
      description: input.description,
      category: input.category,
      tags: tagsFromInput(input.tags),
      city: input.city ?? null,
      priceMode: input.priceMode,
      priceMin: input.priceMin ?? null,
      priceMax: input.priceMax ?? null,
      currency,
      priceSummary: summary ?? null,
      updatedAt: new Date(),
    })
    .where(eq(listing.id, id));
}
export async function setListingStatus(
  authorId: string,
  id: string,
  status: 'active' | 'closed',
): Promise<void> {
  const db = getAppDb();
  const existing = await db.query.listing.findFirst({ where: eq(listing.id, id) });
  if (!existing) throw new Error('listing.notFound');
  if (existing.authorId !== authorId) throw new Error('listing.forbidden');
  await db.update(listing).set({ status, updatedAt: new Date() }).where(eq(listing.id, id));
}
export async function deleteListing(authorId: string, id: string): Promise<void> {
  const db = getAppDb();
  const existing = await db.query.listing.findFirst({ where: eq(listing.id, id) });
  if (!existing) throw new Error('listing.notFound');
  if (existing.authorId !== authorId) throw new Error('listing.forbidden');
  await db.delete(listing).where(eq(listing.id, id));
}
export async function getListing(id: string): Promise<ListingWithAuthor | undefined> {
  const db = getAppDb();
  const row = await db
    .select({
      listing,
      author: {
        id: profile.id,
        displayName: profile.displayName,
        city: profile.city,
        telegram: profile.telegram,
      },
    })
    .from(listing)
    .leftJoin(profile, eq(profile.id, listing.authorId))
    .where(eq(listing.id, id))
    .limit(1);
  if (row.length === 0) return undefined;
  return { ...row[0].listing, author: row[0].author };
}
export async function listMyListings(authorId: string): Promise<Listing[]> {
  const db = getAppDb();
  return db
    .select()
    .from(listing)
    .where(eq(listing.authorId, authorId))
    .orderBy(desc(listing.createdAt));
}
export async function listActiveByAuthor(authorId: string): Promise<Listing[]> {
  const db = getAppDb();
  return db
    .select()
    .from(listing)
    .where(and(eq(listing.authorId, authorId), eq(listing.status, 'active' as const)))
    .orderBy(desc(listing.createdAt));
}
export async function browseListings(filters: BrowseFilters): Promise<ListingWithAuthor[]> {
  const db = getAppDb();
  const conds = [eq(listing.status, 'active' as const)];
  if (filters.kind && filters.kind !== 'all') {
    conds.push(eq(listing.kind, filters.kind));
  }
  if (filters.priceMode && filters.priceMode !== 'any') {
    conds.push(eq(listing.priceMode, filters.priceMode));
  }
  if (filters.category) {
    conds.push(like(sql`lower(${listing.category})`, `%${filters.category.toLowerCase()}%`));
  }
  if (filters.q) {
    const q = `%${filters.q.toLowerCase()}%`;
    conds.push(
      or(
        like(sql`lower(${listing.title})`, q),
        like(sql`lower(${listing.description})`, q),
        like(sql`lower(${listing.tags})`, q),
      )!,
    );
  }
  const rows = await db
    .select({
      listing,
      author: {
        id: profile.id,
        displayName: profile.displayName,
        city: profile.city,
        telegram: profile.telegram,
      },
    })
    .from(listing)
    .leftJoin(profile, eq(profile.id, listing.authorId))
    .where(and(...conds))
    .orderBy(desc(listing.createdAt))
    .limit(100);
  return rows.map((r) => ({ ...r.listing, author: r.author }));
}
