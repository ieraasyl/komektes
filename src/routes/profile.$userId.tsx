import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useTranslation } from 'react-i18next';
import { PaperPlaneTiltIcon, StarIcon } from '@phosphor-icons/react';
import { getProfile } from '@/lib/profile.server';
import { listActiveByAuthor } from '@/lib/listings.server';
import { listReviewsForUser, getRatingAggregate } from '@/lib/reviews.server';
import { getSession } from '@/lib/auth.server';
import { getRequest } from '@tanstack/react-start/server';
import { AuthHeader } from '@/components/AuthHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ListingCard from '@/components/listings/ListingCard';
const loadProfile = createServerFn({ method: 'GET' })
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    const prof = await getProfile(data.userId);
    if (!prof) return null;
    const [listings, reviews, rating] = await Promise.all([
      listActiveByAuthor(prof.id),
      listReviewsForUser(prof.id),
      getRatingAggregate(prof.id),
    ]);
    return {
      profile: {
        id: prof.id,
        displayName: prof.displayName,
        city: prof.city,
        bio: prof.bio,
        telegram: session ? prof.telegram : null,
      },
      listings: listings.map((l) => ({
        ...l,
        author: {
          id: prof.id,
          displayName: prof.displayName,
          city: prof.city,
          telegram: prof.telegram,
        },
      })),
      reviews,
      rating,
      isViewerSignedIn: !!session,
    };
  });
export const Route = createFileRoute('/profile/$userId')({
  loader: async ({ params }) => {
    const data = await loadProfile({ data: { userId: params.userId } });
    if (!data) throw notFound();
    return data;
  },
  component: ProfilePage,
});
function ProfilePage() {
  const { t } = useTranslation();
  const data = Route.useLoaderData();
  const { profile: p, listings, reviews, rating, isViewerSignedIn } = data;
  const initials = (p.displayName || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
                >
                  {initials}
                </span>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {p.displayName}
                  </h1>
                  {p.city && <p className="mt-1 text-sm text-muted-foreground">{p.city}</p>}
                  {p.bio && (
                    <p className="mt-3 max-w-prose text-sm leading-relaxed text-foreground">
                      {p.bio}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground">{t('profile.rating')}</p>
                {rating.count > 0 ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-2xl font-bold text-foreground">
                    <StarIcon weight="fill" className="size-5 text-brand-star" />
                    {rating.average.toFixed(1)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      ({rating.count})
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{t('profile.noReviews')}</p>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {t('profile.contact')}
              </p>
              {p.telegram ? (
                <a
                  href={`https://t.me/${p.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base font-semibold text-primary hover:underline"
                >
                  <PaperPlaneTiltIcon weight="fill" className="size-4" />@{p.telegram}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isViewerSignedIn ? '—' : t('profile.signInToSeeContact')}{' '}
                  {!isViewerSignedIn && (
                    <Link
                      to="/login"
                      search={{ redirect: undefined }}
                      className="text-primary hover:underline"
                    >
                      {t('profile.signIn')}
                    </Link>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="mb-10">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {t('profile.activeListings')} ({listings.length})
          </h2>
          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t('profile.noListings')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-base font-semibold text-foreground">
            {t('profile.reviews')} ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t('profile.noReviewsYet')}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {reviews.map((r) => (
                <li key={r.id}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {r.author ? (
                            <Link
                              to="/profile/$userId"
                              params={{ userId: r.author.id }}
                              className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                            >
                              {r.author.displayName}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                          <Badge className="gap-0.5 bg-brand-star/15 text-brand-star">
                            <StarIcon weight="fill" />
                            {r.rating}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.text && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {r.text}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
