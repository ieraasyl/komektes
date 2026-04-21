import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { AppHeader } from '@/components/AppHeader';
export const Route = createFileRoute('/terms')({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: 'Terms of Service | komektes' },
      {
        name: 'description',
        content:
          'What you agree to by using komektes: behaviour we allow, what the site does, and where our liability ends.',
      },
    ],
  }),
});
function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: April 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">1. Acceptance</h2>
            <p>
              By creating an account on komektes, you agree to these Terms. If you do not agree,
              please don&apos;t use the service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">2. What komektes is</h2>
            <p>
              komektes hosts listings and shows how to reach people on Telegram. We are not part of
              any deal between users. Money, timing, and the actual help happen between you, not
              through us.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">3. Your content</h2>
            <p>
              You are responsible for the accuracy and legality of your listings and reviews.
              Don&apos;t post illegal services, scams, hate speech, or anything you don&apos;t have
              the right to offer.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">4. Reviews</h2>
            <p>
              Reviews must reflect a genuine engagement. We may remove reviews that we believe are
              fake, abusive, or off-topic.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">5. Account termination</h2>
            <p>
              We may suspend or remove accounts that violate these Terms. You can delete your
              listings at any time and contact us to request account deletion.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              6. Limitation of liability
            </h2>
            <p>
              The platform is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for losses arising from interactions between users, off-platform payments, or
              quality of help provided.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-foreground">7. Changes</h2>
            <p>
              We may update these Terms from time to time. Continued use of komektes after changes
              constitutes acceptance.
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
