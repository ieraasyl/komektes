import { env } from 'cloudflare:workers';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { engagement, profile, review, type Review } from '@/db/schema';
interface AppEnv {
  DB: D1Database;
}
function getAppDb() {
  const appEnv = env as unknown as AppEnv;
  return getDb(appEnv.DB);
}
export type ReviewWithAuthor = Review & {
  author: {
    id: string;
    displayName: string;
  } | null;
};
export async function createReview(input: {
  engagementId: string;
  authorId: string;
  rating: number;
  text?: string;
}): Promise<string> {
  const db = getAppDb();
  const eng = await db.query.engagement.findFirst({
    where: eq(engagement.id, input.engagementId),
  });
  if (!eng) throw new Error('review.engagementNotFound');
  if (!eng.completedAt) throw new Error('review.engagementNotComplete');
  let subjectId: string;
  if (eng.ownerId === input.authorId) subjectId = eng.counterpartId;
  else if (eng.counterpartId === input.authorId) subjectId = eng.ownerId;
  else throw new Error('review.notAParticipant');
  const id = crypto.randomUUID();
  await db.insert(review).values({
    id,
    engagementId: input.engagementId,
    authorId: input.authorId,
    subjectId,
    rating: input.rating,
    text: input.text ?? null,
  });
  return id;
}
export async function listReviewsForUser(subjectId: string): Promise<ReviewWithAuthor[]> {
  const db = getAppDb();
  const rows = await db
    .select({
      review,
      author: { id: profile.id, displayName: profile.displayName },
    })
    .from(review)
    .leftJoin(profile, eq(profile.id, review.authorId))
    .where(eq(review.subjectId, subjectId))
    .orderBy(desc(review.createdAt))
    .limit(100);
  return rows.map((r) => ({ ...r.review, author: r.author }));
}
export type RatingAggregate = {
  average: number;
  count: number;
};
export async function getRatingAggregate(subjectId: string): Promise<RatingAggregate> {
  const db = getAppDb();
  const row = await db
    .select({
      avg: sql<number | null>`avg(${review.rating})`,
      count: sql<number>`count(*)`,
    })
    .from(review)
    .where(eq(review.subjectId, subjectId))
    .get();
  if (!row || !row.count) return { average: 0, count: 0 };
  return { average: row.avg ?? 0, count: row.count };
}
export async function hasUserReviewed(engagementId: string, authorId: string): Promise<boolean> {
  const db = getAppDb();
  const r = await db.query.review.findFirst({
    where: and(eq(review.engagementId, engagementId), eq(review.authorId, authorId)),
  });
  return !!r;
}
