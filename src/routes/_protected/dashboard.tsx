import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient, useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { useWebHaptics } from 'web-haptics/react';
import { getSession } from '@/lib/auth.server';
import {
  listMyListings,
  setListingStatus,
  deleteListing as deleteListingFn,
} from '@/lib/listings.server';
import { getProfile } from '@/lib/profile.server';
import { getRatingAggregate } from '@/lib/reviews.server';
import { webHapticsOptions } from '@/lib/web-haptics';
import { PlusIcon, StarIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Badge } from '@/components/ui/badge';
import { AppHeader } from '@/components/AppHeader';
import type { Listing } from '@/db/schema';
const getDashboardData = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const session = await getSession(request);
  if (!session) throw new Error('Unauthorized');
  const [profile, listings, rating] = await Promise.all([
    getProfile(session.user.id),
    listMyListings(session.user.id),
    getRatingAggregate(session.user.id),
  ]);
  return {
    profile,
    listings,
    rating,
  };
});
const closeListingFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; status: 'active' | 'closed' }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) throw new Error('Unauthorized');
    await setListingStatus(session.user.id, data.id, data.status);
  });
const removeListingFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) throw new Error('Unauthorized');
    await deleteListingFn(session.user.id, data.id);
  });
const dashboardQuery = queryOptions({
  queryKey: ['dashboard'],
  queryFn: () => getDashboardData(),
});
export const Route = createFileRoute('/_protected/dashboard')({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: Dashboard,
});
function Dashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const { data } = useSuspenseQuery(dashboardQuery);
  const closeMutation = useMutation({
    mutationFn: (input: { id: string; status: 'active' | 'closed' }) =>
      closeListingFn({ data: input }),
    onSuccess: () => {
      trigger?.('success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => trigger?.('error'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeListingFn({ data: { id } }),
    onSuccess: () => {
      trigger?.('success');
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: () => trigger?.('error'),
  });
  const offers = data.listings.filter((l: Listing) => l.kind === 'offer');
  const requests = data.listings.filter((l: Listing) => l.kind === 'request');
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('dashboard.welcomeBack')} {data.profile?.displayName}
            </h1>
            <p className="mt-2 inline-flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <span>@{data.profile?.telegram}</span>
              <span className="text-border">·</span>
              {data.rating.count > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <StarIcon weight="fill" className="size-3.5 text-brand-star" />
                  {t('dashboard.ratingSummary', {
                    avg: data.rating.average.toFixed(1),
                    count: data.rating.count,
                  })}
                </span>
              ) : (
                <span>{t('dashboard.noReviewsYet')}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link to="/listings/new" search={{ kind: 'offer' as const }} />}>
              <PlusIcon weight="bold" />
              {t('dashboard.newOffer')}
            </Button>
            <Button
              variant="outline"
              render={<Link to="/listings/new" search={{ kind: 'request' as const }} />}
            >
              <PlusIcon weight="bold" />
              {t('dashboard.newRequest')}
            </Button>
          </div>
        </div>

        <section className="grid gap-8 md:grid-cols-2">
          <ListingsColumn
            title={t('dashboard.myOffers')}
            empty={t('dashboard.noOffers')}
            items={offers}
            onClose={(id, status) => closeMutation.mutate({ id, status })}
            onDelete={(id) => deleteMutation.mutate(id)}
            t={t}
          />
          <ListingsColumn
            title={t('dashboard.myRequests')}
            empty={t('dashboard.noRequests')}
            items={requests}
            onClose={(id, status) => closeMutation.mutate({ id, status })}
            onDelete={(id) => deleteMutation.mutate(id)}
            t={t}
          />
        </section>
      </main>
    </div>
  );
}
function ListingsColumn({
  title,
  empty,
  items,
  onClose,
  onDelete,
  t,
}: {
  title: string;
  empty: string;
  items: Listing[];
  onClose: (id: string, status: 'active' | 'closed') => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((l) => (
            <li key={l.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/listings/$id"
                          params={{ id: l.id }}
                          className="truncate text-base font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {l.title}
                        </Link>
                        {l.status !== 'active' && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {l.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {l.category}
                        {l.priceSummary ? ` · ${l.priceSummary}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      render={<Link to="/listings/$id/edit" params={{ id: l.id }} />}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onClose(l.id, l.status === 'active' ? 'closed' : 'active')}
                    >
                      {l.status === 'active' ? t('dashboard.close') : t('dashboard.reopen')}
                    </Button>
                    <ConfirmButton
                      label={t('common.delete')}
                      confirmLabel={t('common.confirmAction')}
                      onConfirm={() => onDelete(l.id)}
                      variant="outline"
                      size="xs"
                      className="text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                    />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
