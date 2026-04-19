import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP } from 'better-auth/plugins';
export const auth = betterAuth({
  database: drizzleAdapter(null as never, {
    provider: 'sqlite',
    schema: {},
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  appName: 'komektes',
  ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET && {
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      },
    }),
  plugins: [
    emailOTP({
      async sendVerificationOTP() {},
    }),
  ],
});
