import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from '@/db/schema';
import * as authSchema from '@/db/auth-schema';
export const fullSchema = {
  ...schema,
  ...authSchema,
};
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema: fullSchema });
}
export * from '@/db/schema';
export * from '@/db/auth-schema';
