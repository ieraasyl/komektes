import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
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
  .inputValidator((input: BrowseFilters) => input)
  .handler(async ({ data }) => {
    const parsed = browseFiltersSchema.safeParse(data);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    return browseListings(parsed.data);
  });
const browseSearchSchema = browseFiltersSchema;
export const Route = createFileRoute('/browse')({
  validateSearch: browseSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return browseFn({ data: deps });
  },
  component: BrowsePage,
});
function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
}
function BrowsePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const listings = Route.useLoaderData();
  const [q, setQ] = useState(search.q ?? '');
  const [category, setCategory] = useState(search.category ?? '');
  const apply = (next: Partial<BrowseFilters>) => {
    navigate({
      to: '/browse',
      search: { ...search, ...next },
    });
  };
  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    apply({ q: q.trim() || undefined, category: category.trim() || undefined });
  };
  const kind = search.kind ?? 'all';
  const priceMode = search.priceMode ?? 'any';
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
                <PillButton active={kind === 'all'} onClick={() => apply({ kind: 'all' })}>
                  {t('browse.kinds.all')}
                </PillButton>
                {LISTING_KINDS.map((k) => (
                  <PillButton key={k} active={kind === k} onClick={() => apply({ kind: k })}>
                    {t(`listingForm.kinds.${k}`)}
                  </PillButton>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t('browse.priceMode')}
              </p>
              <div className="flex flex-wrap gap-2">
                <PillButton
                  active={priceMode === 'any'}
                  onClick={() => apply({ priceMode: 'any' })}
                >
                  {t('browse.priceModes.any')}
                </PillButton>
                {PRICE_MODES.map((m) => (
                  <PillButton
                    key={m}
                    active={priceMode === m}
                    onClick={() => apply({ priceMode: m })}
                  >
                    {t(`listingForm.priceModes.${m}`)}
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
