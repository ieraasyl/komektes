import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
import { env } from 'cloudflare:workers';
import { getDb } from '@/db';
import { user, session, account, verification } from '@/db/auth-schema';
interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GAS_URL?: string;
  GAS_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
export function getAuth() {
  const authEnv = env as unknown as AuthEnv;
  const d1Binding = authEnv.DB;
  const secret = authEnv.BETTER_AUTH_SECRET;
  const url = authEnv.BETTER_AUTH_URL;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is not set');
  if (!url) throw new Error('BETTER_AUTH_URL is not set');
  if (!d1Binding) throw new Error('D1 binding (DB) is not configured');
  const db = getDb(d1Binding);
  const gasUrl = authEnv.GAS_URL;
  const gasSecret = authEnv.GAS_SECRET;
  const googleClientId = authEnv.GOOGLE_CLIENT_ID;
  const googleClientSecret = authEnv.GOOGLE_CLIENT_SECRET;
  const socialProviders =
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined;
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user, session, account, verification },
    }),
    secret,
    appName: 'komektes',
    baseURL: url,
    ...(socialProviders && { socialProviders }),
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 300,
        async sendVerificationOTP({ email, otp, type }) {
          if (!gasUrl || !gasSecret) {
            console.log(`[OTP] GAS not configured — type=${type} email=${email} otp=${otp}`);
            return;
          }
          try {
            const res = await fetch(gasUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                secret: gasSecret,
                action: 'send-otp',
                email,
                otp,
                type,
              }),
            });
            if (!res.ok) {
              console.error(`[OTP] GAS returned HTTP ${res.status}`);
            }
          } catch (err) {
            console.error('[OTP] Failed to call GAS:', err);
          }
        },
      }),
    ],
  });
}
export async function getSession(request: Request) {
  const auth = getAuth();
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}
export async function ensureSession(request: Request) {
  const session = await getSession(request);
  if (!session) throw new Error('Unauthorized');
  return session;
}
