import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { AppHeader } from '@/components/AppHeader';
export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: 'Privacy Policy | komektes' },
      {
        name: 'description',
        content: 'What komektes stores, why it needs it, and how to get your data removed.',
      },
    ],
  }),
});
function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. What we store</h2>
            <p>
              When you sign in to komektes, we store your email address and (if you sign in with
              Google) your name and profile picture. When you complete onboarding, we store your
              display name, Telegram handle, and optional city and bio. Listings, engagements and
              reviews you create are also stored.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. How we use it</h2>
            <p>
              We use it to log you in, show your listings, and let signed-in users see your Telegram
              handle so they can message you.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. Visibility</h2>
            <p>
              Your display name, listings, and reviews are visible to anyone. Your Telegram handle
              is visible only to other signed-in users. Your email address is not shown to other
              users.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Storage</h2>
            <p>
              Data is stored on Cloudflare D1 and transmitted over HTTPS. We do not sell your data
              to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Deletion</h2>
            <p>
              You can delete your listings at any time from your dashboard. To delete your account
              and associated data, contact us using the address below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">6. Contact</h2>
            <p>
              For privacy questions or deletion requests, reach the team at the contact address
              shown on the homepage.
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="mt-12 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeftIcon weight="bold" className="size-3.5" />
          Back to home
        </button>
      </main>
    </div>
  );
}
