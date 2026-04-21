import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { browseListings } from '@/lib/listings.server';
import { browseFiltersSchema, type BrowseFilters } from '@/lib/validation';
import { LISTING_KINDS, PRICE_MODES } from '@/db/schema';
import { AppHeader } from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import ListingCard from '@/components/listings/ListingCard';
const browseFn = createServerFn({ method: 'GET' })
  .inputValidator((input: BrowseFilters) => browseFiltersSchema.parse(input))
  .handler(async ({ data }) => browseListings(data));
const browseSearchSchema = browseFiltersSchema;
export const Route = createFileRoute('/browse')({
  validateSearch: browseSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => browseFn({ data: deps }),
  staleTime: 30_000,
  gcTime: 5 * 60_000,
  component: BrowsePage,
});
const PillButton = memo(function PillButton({
  active,
  value,
  onClick,
  children,
}: {
  active: boolean;
  value: string;
  onClick: (value: string) => void;
  children: React.ReactNode;
}) {
  const handle = useCallback(() => onClick(value), [onClick, value]);
  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
});
function BrowsePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const listings = Route.useLoaderData();
  const [q, setQ] = useState(search.q ?? '');
  const [category, setCategory] = useState(search.category ?? '');
  const apply = useCallback(
    (next: Partial<BrowseFilters>) => {
      navigate({ to: '/browse', search: { ...search, ...next, page: undefined } });
    },
    [navigate, search],
  );
  const onSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      apply({ q: q.trim() || undefined, category: category.trim() || undefined });
    },
    [apply, q, category],
  );
  const onKindClick = useCallback(
    (value: string) => apply({ kind: value as BrowseFilters['kind'] }),
    [apply],
  );
  const onPriceModeClick = useCallback(
    (value: string) => apply({ priceMode: value as BrowseFilters['priceMode'] }),
    [apply],
  );
  const kind = search.kind ?? 'all';
  const priceMode = search.priceMode ?? 'any';
  const kindOptions = useMemo(() => ['all', ...LISTING_KINDS] as const, []);
  const priceOptions = useMemo(() => ['any', ...PRICE_MODES] as const, []);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('browse.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('browse.subtitle')}</p>
        </header>

        <form
          onSubmit={onSearch}
          className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 ring-1 ring-black/5"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t('browse.search')}
              </FieldLabel>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('browse.searchPlaceholder')}
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t('browse.category')}
              </FieldLabel>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('browse.categoryPlaceholder')}
              />
            </Field>
            <div className="flex items-end">
              <Button type="submit" size="lg" className="w-full md:w-auto">
                <MagnifyingGlassIcon weight="bold" />
                {t('browse.apply')}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t('browse.kind')}</p>
              <div className="flex flex-wrap gap-2">
                {kindOptions.map((k) => (
                  <PillButton
                    key={k}
                    value={k}
                    active={kind === k}
                    onClick={onKindClick}
                  >
                    {k === 'all' ? t('browse.kinds.all') : t(`listingForm.kinds.${k}`)}
                  </PillButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t('browse.priceMode')}
              </p>
              <div className="flex flex-wrap gap-2">
                {priceOptions.map((m) => (
                  <PillButton
                    key={m}
                    value={m}
                    active={priceMode === m}
                    onClick={onPriceModeClick}
                  >
                    {m === 'any' ? t('browse.priceModes.any') : t(`listingForm.priceModes.${m}`)}
                  </PillButton>
                ))}
              </div>
            </div>
          </div>
        </form>

        {listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t('browse.empty')}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
