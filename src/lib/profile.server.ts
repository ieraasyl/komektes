import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { profile, type Profile } from '@/db/schema';
interface AppEnv {
  DB: D1Database;
}
function getAppDb() {
  const appEnv = env as unknown as AppEnv;
  return getDb(appEnv.DB);
}
export async function getProfile(userId: string): Promise<Profile | undefined> {
  const db = getAppDb();
  return db.query.profile.findFirst({ where: eq(profile.id, userId) });
}
export async function upsertProfile(data: {
  userId: string;
  displayName: string;
  telegram: string;
  city?: string;
  bio?: string;
}): Promise<void> {
  const db = getAppDb();
  await db
    .insert(profile)
    .values({
      id: data.userId,
      displayName: data.displayName,
      telegram: data.telegram,
      city: data.city ?? null,
      bio: data.bio ?? null,
    })
    .onConflictDoUpdate({
      target: profile.id,
      set: {
        displayName: data.displayName,
        telegram: data.telegram,
        city: data.city ?? null,
        bio: data.bio ?? null,
        updatedAt: new Date(),
      },
    });
}
