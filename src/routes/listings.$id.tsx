import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { getSession } from '@/lib/auth.server';
import { getListing, type ListingWithAuthor } from '@/lib/listings.server';
import {
  ensureEngagement,
  markEngagementComplete,
  listMyEngagements,
} from '@/lib/engagements.server';
import { createReview as createReviewSrv, hasUserReviewed } from '@/lib/reviews.server';
import { reviewSchema, tagsToArray } from '@/lib/validation';
import { webHapticsOptions } from '@/lib/web-haptics';
import { ArrowLeftIcon, MapPinIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
type ViewerEngagement = {
  id: string;
  completedAt: number | null;
  isOwner: boolean;
  hasReviewed: boolean;
};
type AuthorView = {
  id: string;
  displayName: string;
  city: string | null;
  telegram: string | null;
};
type LoadResult = {
  listing: Omit<ListingWithAuthor, 'author'> & {
    author: AuthorView | null;
  };
  viewer: {
    id: string;
    email: string;
  } | null;
  engagement: ViewerEngagement | null;
};
const loadListing = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<LoadResult | null> => {
    const request = getRequest();
    const session = await getSession(request);
    const found = await getListing(data.id);
    if (!found) return null;
    let viewerEngagement: ViewerEngagement | null = null;
    if (session) {
      const engs = await listMyEngagements(session.user.id);
      const eng = engs.find((e) => e.listingId === found.id);
      if (eng) {
        const reviewed = eng.completedAt ? await hasUserReviewed(eng.id, session.user.id) : false;
        viewerEngagement = {
          id: eng.id,
          completedAt: eng.completedAt ? eng.completedAt.getTime() : null,
          isOwner: eng.ownerId === session.user.id,
          hasReviewed: reviewed,
        };
      }
    }
    return {
      listing: {
        ...found,
        author: found.author
          ? { ...found.author, telegram: session ? found.author.telegram : null }
          : null,
      },
      viewer: session ? { id: session.user.id, email: session.user.email } : null,
      engagement: viewerEngagement,
    };
  });
const contactFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { listingId: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) throw new Error('auth.required');
    const found = await getListing(data.listingId);
    if (!found) throw new Error('listing.notFound');
    if (found.authorId === session.user.id) throw new Error('engagement.cannotEngageSelf');
    const eng = await ensureEngagement(data.listingId, session.user.id);
    return { engagementId: eng.id };
  });
const completeFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { engagementId: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) throw new Error('auth.required');
    await markEngagementComplete(data.engagementId, session.user.id);
  });
const submitReviewFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { engagementId: string; rating: number; text?: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) throw new Error('auth.required');
    const parsed = reviewSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    await createReviewSrv({
      engagementId: parsed.data.engagementId,
      authorId: session.user.id,
      rating: parsed.data.rating,
      text: parsed.data.text,
    });
  });
export const Route = createFileRoute('/listings/$id')({
  loader: async ({ params }) => {
    const data = await loadListing({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  component: ListingDetailPage,
});
function ListingDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const data = Route.useLoaderData();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const { listing, viewer, engagement } = data;
  const isOwnListing = viewer?.id === listing.authorId;
  const tags = tagsToArray(listing.tags);
  const reload = () => navigate({ to: '/listings/$id', params: { id: listing.id } });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const onContact = async () => {
    setContactLoading(true);
    setContactError(null);
    try {
      await contactFn({ data: { listingId: listing.id } });
      trigger?.('success');
      await reload();
    } catch (err) {
      trigger?.('error');
      setContactError(err instanceof Error ? err.message : 'error');
    } finally {
      setContactLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 text-sm text-muted-foreground">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon weight="bold" className="size-3.5" />
            {t('listingDetail.back')}
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge
                className={
                  listing.kind === 'offer'
                    ? 'bg-brand-offer-soft text-brand-offer'
                    : 'bg-brand-request-soft text-brand-request'
                }
              >
                {t(`listingForm.kinds.${listing.kind}`)}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {listing.category}
              </Badge>
              {listing.city && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <MapPinIcon weight="fill" />
                  {listing.city}
                </Badge>
              )}
              {listing.status !== 'active' && (
                <Badge variant="outline" className="border-destructive/40 text-destructive">
                  {listing.status}
                </Badge>
              )}
            </div>

            <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              {listing.title}
            </h1>
            <p className="mb-8 text-lg font-semibold text-foreground">
              {listing.priceSummary ?? t(`listingForm.priceModes.${listing.priceMode}`)}
            </p>

            <div className="mb-6 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {listing.description}
            </div>

            {tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs text-muted-foreground">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t('listingDetail.author')}
              </p>
              <div className="flex items-center justify-between gap-3">
                <div>
                  {listing.author ? (
                    <Link
                      to="/profile/$userId"
                      params={{ userId: listing.author.id }}
                      className="text-base font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      {listing.author.displayName}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('listingDetail.unknownAuthor')}
                    </span>
                  )}
                  {listing.author?.city && (
                    <p className="text-xs text-muted-foreground">{listing.author.city}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              {!viewer ? (
                <div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {t('listingDetail.signInToContact')}
                  </p>
                  <Button
                    render={<Link to="/login" search={{ redirect: `/listings/${listing.id}` }} />}
                  >
                    {t('listingDetail.signIn')}
                  </Button>
                </div>
              ) : isOwnListing ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-muted-foreground">{t('listingDetail.thisIsYours')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link to="/listings/$id/edit" params={{ id: listing.id }} />}
                  >
                    {t('common.edit')}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {listing.author?.telegram && (
                    <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <PaperPlaneTiltIcon weight="fill" />
                      </span>
                      <div>
                        <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                          {t('listingDetail.contact')}
                        </p>
                        <a
                          href={`https://t.me/${listing.author.telegram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-semibold text-primary hover:underline"
                        >
                          @{listing.author.telegram}
                        </a>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('listingDetail.contactNote')}
                        </p>
                      </div>
                    </div>
                  )}
                  {!engagement && (
                    <div>
                      <Button
                        onClick={onContact}
                        disabled={contactLoading}
                        variant="outline"
                        size="sm"
                      >
                        {contactLoading
                          ? t('listingDetail.connecting')
                          : t('listingDetail.markContacted')}
                      </Button>
                      {contactError && (
                        <p className="mt-2 text-sm text-destructive">{t(contactError)}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {viewer && engagement && (
          <EngagementPanel
            engagement={engagement}
            onComplete={async () => {
              await completeFn({ data: { engagementId: engagement.id } });
              trigger?.('success');
              await reload();
            }}
            onSubmitReview={async (rating, text) => {
              await submitReviewFn({
                data: { engagementId: engagement.id, rating, text },
              });
              trigger?.('success');
              await reload();
            }}
          />
        )}
      </main>
    </div>
  );
}
function EngagementPanel({
  engagement,
  onComplete,
  onSubmitReview,
}: {
  engagement: ViewerEngagement;
  onComplete: () => Promise<void>;
  onSubmitReview: (rating: number, text?: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!engagement.completedAt) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6">
          <h2 className="mb-1 text-base font-semibold text-foreground">
            {t('engagement.activeTitle')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('engagement.activeDesc')}</p>
          <Button
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await onComplete();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'error');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            {loading ? t('common.saving') : t('engagement.markComplete')}
          </Button>
          {error && <p className="mt-2 text-sm text-destructive">{t(error)}</p>}
        </CardContent>
      </Card>
    );
  }
  if (engagement.hasReviewed) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 text-sm text-muted-foreground">
          {t('engagement.alreadyReviewed')}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          {t('engagement.leaveReview')}
        </h2>
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground">
            {t('engagement.rating')}
          </FieldLabel>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={
                  'cursor-pointer text-3xl transition-colors ' +
                  (n <= rating
                    ? 'text-brand-star'
                    : 'text-muted-foreground/30 hover:text-brand-star/60')
                }
                aria-label={String(n)}
              >
                ★
              </button>
            ))}
          </div>
        </Field>
        <Field>
          <FieldLabel className="text-sm font-medium text-foreground">
            {t('engagement.reviewText')}
          </FieldLabel>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
          />
        </Field>
        <Button
          className="mt-4"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await onSubmitReview(rating, text || undefined);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'error');
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t('common.saving') : t('engagement.submitReview')}
        </Button>
        {error && <p className="mt-2 text-sm text-destructive">{t(error)}</p>}
      </CardContent>
    </Card>
  );
}
