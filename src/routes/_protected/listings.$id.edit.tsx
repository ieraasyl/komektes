import {
  createFileRoute,
  notFound,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { getSession } from '@/lib/auth.server';
import { getListing, updateListing } from '@/lib/listings.server';
import { listingSchema } from '@/lib/validation';
import { webHapticsOptions } from '@/lib/web-haptics';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import ListingForm, { type ListingFormState } from '@/components/listings/ListingForm';
import { tagsToArray } from '@/lib/validation';
const loadEditData = createServerFn({ method: 'GET' })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }
    const listing = await getListing(data.id);
    if (!listing) return null;
    if (listing.authorId !== session.user.id) throw new Error('listing.forbidden');
    return listing;
  });
const updateListingFn = createServerFn({ method: 'POST' })
  .inputValidator((input: { id: string; data: ListingFormState }) => input)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }
    const parsed = listingSchema.safeParse({
      kind: data.data.kind,
      title: data.data.title,
      description: data.data.description,
      category: data.data.category,
      tags: data.data.tags || undefined,
      city: data.data.city || undefined,
      priceMode: data.data.priceMode,
      priceMin: data.data.priceMin === '' ? undefined : data.data.priceMin,
      priceMax: data.data.priceMax === '' ? undefined : data.data.priceMax,
      currency: data.data.currency || undefined,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }
    await updateListing(session.user.id, data.id, parsed.data);
  });
export const Route = createFileRoute('/_protected/listings/$id/edit')({
  loader: async ({ params }) => {
    const data = await loadEditData({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  component: EditListingPage,
});
function EditListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const listing = Route.useLoaderData();
  const params = Route.useParams();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const [state, setState] = useState<ListingFormState>(() => ({
    kind: listing.kind,
    title: listing.title,
    description: listing.description,
    category: listing.category,
    tags: tagsToArray(listing.tags).join(', '),
    city: listing.city ?? '',
    priceMode: listing.priceMode,
    priceMin: listing.priceMin?.toString() ?? '',
    priceMax: listing.priceMax?.toString() ?? '',
    currency: listing.currency,
  }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateListingFn({ data: { id: params.id, data: state } });
      trigger?.('success');
      await navigate({ to: '/listings/$id', params: { id: params.id } });
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
              {t('listingForm.editTitle')}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">{t('listingForm.editDesc')}</p>
            <ListingForm
              state={state}
              setState={setState}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
              submitLabel={t('common.save')}
              loadingLabel={t('common.saving')}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
