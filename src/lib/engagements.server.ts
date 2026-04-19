import { env } from 'cloudflare:workers';
import { and, eq, isNotNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { engagement, listing, type Engagement } from '@/db/schema';
interface AppEnv {
  DB: D1Database;
}
function getAppDb() {
  const appEnv = env as unknown as AppEnv;
  return getDb(appEnv.DB);
}
export async function ensureEngagement(
  listingId: string,
  counterpartId: string,
): Promise<Engagement> {
  const db = getAppDb();
  const lst = await db.query.listing.findFirst({ where: eq(listing.id, listingId) });
  if (!lst) throw new Error('listing.notFound');
  if (lst.authorId === counterpartId) {
    throw new Error('engagement.cannotEngageSelf');
  }
  const existing = await db.query.engagement.findFirst({
    where: and(
      eq(engagement.listingId, listingId),
      eq(engagement.ownerId, lst.authorId),
      eq(engagement.counterpartId, counterpartId),
    ),
  });
  if (existing) return existing;
  const id = crypto.randomUUID();
  await db.insert(engagement).values({
    id,
    listingId,
    ownerId: lst.authorId,
    counterpartId,
  });
  const created = await db.query.engagement.findFirst({ where: eq(engagement.id, id) });
  if (!created) throw new Error('engagement.creationFailed');
  return created;
}
export async function markEngagementComplete(
  engagementId: string,
  userId: string,
): Promise<Engagement> {
  const db = getAppDb();
  const eng = await db.query.engagement.findFirst({ where: eq(engagement.id, engagementId) });
  if (!eng) throw new Error('engagement.notFound');
  if (eng.ownerId !== userId && eng.counterpartId !== userId) {
    throw new Error('engagement.forbidden');
  }
  if (eng.completedAt) return eng;
  await db
    .update(engagement)
    .set({ completedAt: new Date() })
    .where(eq(engagement.id, engagementId));
  const updated = await db.query.engagement.findFirst({ where: eq(engagement.id, engagementId) });
  if (!updated) throw new Error('engagement.updateFailed');
  return updated;
}
export async function listMyEngagements(userId: string): Promise<Engagement[]> {
  const db = getAppDb();
  return db
    .select()
    .from(engagement)
    .where(or(eq(engagement.ownerId, userId), eq(engagement.counterpartId, userId)))
    .all();
}
export async function listReviewableEngagements(userId: string): Promise<Engagement[]> {
  const db = getAppDb();
  return db
    .select()
    .from(engagement)
    .where(
      and(
        isNotNull(engagement.completedAt),
        or(eq(engagement.ownerId, userId), eq(engagement.counterpartId, userId)),
      ),
    )
    .all();
}
export async function getEngagement(id: string): Promise<Engagement | undefined> {
  const db = getAppDb();
  return db.query.engagement.findFirst({ where: eq(engagement.id, id) });
}
