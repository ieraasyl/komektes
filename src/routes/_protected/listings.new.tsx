import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { getSession } from '@/lib/auth.server';
import { createListing } from '@/lib/listings.server';
import { listingSchema } from '@/lib/validation';
import { webHapticsOptions } from '@/lib/web-haptics';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import ListingForm, {
  emptyListingForm,
  type ListingFormState,
} from '@/components/listings/ListingForm';
import { LISTING_KINDS, type ListingKind } from '@/db/schema';
const createListingFn = createServerFn({ method: 'POST' })
  .inputValidator((input: ListingFormState) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }
    const parsed = listingSchema.safeParse({
      kind: data.kind,
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags || undefined,
      city: data.city || undefined,
      priceMode: data.priceMode,
      priceMin: data.priceMin === '' ? undefined : data.priceMin,
      priceMax: data.priceMax === '' ? undefined : data.priceMax,
      currency: data.currency || undefined,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }
    const id = await createListing(session.user.id, parsed.data);
    return { id };
  });
export const Route = createFileRoute('/_protected/listings/new')({
  validateSearch: (s: Record<string, unknown>) => ({
    kind: s.kind === 'request' ? 'request' : 'offer',
  }),
  component: NewListingPage,
});
function NewListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const initial = useMemo<ListingFormState>(
    () => ({
      ...emptyListingForm,
      kind: (LISTING_KINDS.includes(search.kind as ListingKind)
        ? search.kind
        : 'offer') as ListingKind,
    }),
    [search.kind],
  );
  const [state, setState] = useState<ListingFormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await createListingFn({ data: state });
      trigger?.('success');
      await navigate({ to: '/listings/$id', params: { id: result.id } });
    } catch (err) {
      trigger?.('error');
      setError(err instanceof Error ? t(err.message) : t('listingForm.unknownError'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <Card>
          <CardContent className="p-6">
            <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
              {t('listingForm.newTitle')}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">{t('listingForm.newDesc')}</p>
            <ListingForm
              state={state}
              setState={setState}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              submitLabel={t('listingForm.publish')}
              loadingLabel={t('listingForm.publishing')}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
