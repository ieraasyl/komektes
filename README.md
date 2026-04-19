# komektes

A peer-to-peer help marketplace where people post **offers** ("I can help with X") and **requests** ("I need help with Y"), connect via Telegram, and leave reviews after the engagement.

## Features

- **Auth**: Email OTP or Google OAuth via [better-auth](https://better-auth.com).
- **Onboarding**: Display name + Telegram handle + optional city/bio.
- **Listings**: Create / edit / close offers and requests with category, tags, and structured pricing (fixed, hourly, negotiable, free).
- **Browse**: Filter listings by kind, category, and price mode; full-text-ish search across title/description/tags.
- **Engagement & reviews**: Once two users have connected (an "engagement" record), either side can mark it complete and leave a 1–5 ★ review.
- **i18n**: English, Kazakh, Russian.

## Tech Stack

TanStack Start (React) on Cloudflare Workers. D1 + Drizzle ORM for storage. better-auth for sessions/OTP/Google. Tailwind CSS v4 + shadcn/ui (base-ui). i18next.

## Setup

1. Install [Bun](https://bun.sh).
2. Clone the repo and `cd` into it.
3. Create `.env` and `.dev.vars` in the project root:

   ```bash
   cp .env.example .env
   cp .dev.vars.example .dev.vars
   ```

   - **`.env`** — used on your machine by Drizzle Kit and `bun run auth:generate` (see `.env.example`).
   - **`.dev.vars`** — loaded by Wrangler for `bun run dev`; mirrors production secrets (see `.dev.vars.example`).

   _Note: `.dev.vars` is local only. In production, set the same names with `wrangler secret put <NAME>`._

4. Install dependencies:

   ```bash
   bun install
   ```

5. Generate Cloudflare Worker types:

   ```bash
   bun run types
   ```

6. Apply migrations locally:

   ```bash
   bun run db:migrate:local
   ```

## Email OTP in development

OTP delivery is intentionally not wired to a real email provider in this MVP. During development the OTP is **logged to the server console** by `sendVerificationOTP` in `src/lib/auth.server.ts`. You can also read it from the `verification` table via `bun run db:studio:local`.

For production, plug in your preferred transactional email provider (Resend, Postmark, Cloudflare Email Routing, etc.) inside that function.

## Google OAuth (optional)

To enable "Sign in with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an OAuth 2.0 Client ID (Web application).
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-domain/api/auth/callback/google` (production)
4. Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.dev.vars` (local) or via `wrangler secret put` (production). Leave blank to disable Google login.

## Development

```bash
bun run dev
```

Starts the Vite dev server on port 3000 with Cloudflare Workers bindings via `@cloudflare/vite-plugin`.

- When you change the better-auth config, run `bun run auth:generate && bun run db:generate`.
- When you change the app DB schema, run `bun run db:generate`.

## Before commit

```bash
bun run format
bun run lint
```

## Database

- Inspect local DB: `bun run db:studio:local`
- Inspect remote DB: `bun run db:studio:remote`

You can also inspect the local D1 file at `.wrangler/state/v3/d1` with a SQLite viewer.

## Deploy

```bash
bun run deploy
```

Installs deps, builds, and deploys to Cloudflare Workers. Wrangler will prompt you to log in if needed.

**First-time deploy:** run `bun run db:migrate:remote` before deploying so the remote D1 has the schema.

By default the Worker is available at `https://<name>.<subdomain>.workers.dev`. For production, attach a custom domain via Dashboard → Workers & Pages → your Worker → **Triggers** → **Add Custom Domain**.

## Useful scripts

- `bun run dev` — start dev server on port 3000
- `bun run build` — build for production
- `bun run deploy` — build and deploy to Cloudflare Workers
- `bun run types` — regenerate Cloudflare Worker types
- `bun run db:generate` — generate migrations from schema
- `bun run db:migrate:local` — apply migrations to local D1
- `bun run db:migrate:remote` — apply migrations to remote D1
- `bun run db:studio:local` — open Drizzle Studio for local DB
- `bun run db:studio:remote` — open Drizzle Studio for remote DB
- `bun run auth:generate` — regenerate auth schema from better-auth config
- `bun run lint` / `bun run lint:fix` — ESLint
- `bun run format` / `bun run format:check` — Prettier
