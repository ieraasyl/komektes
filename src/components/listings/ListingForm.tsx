import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { cn } from '@/lib/utils';
import { PRICE_MODES, LISTING_KINDS, type ListingKind, type PriceMode } from '@/db/schema';
function PillButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {children}
    </button>
  );
}
export type ListingFormState = {
  kind: ListingKind;
  title: string;
  description: string;
  category: string;
  tags: string;
  city: string;
  priceMode: PriceMode;
  priceMin: string;
  priceMax: string;
  currency: string;
};
export default function ListingForm({
  state,
  setState,
  loading,
  error,
  onSubmit,
  submitLabel,
  loadingLabel,
}: {
  state: ListingFormState;
  setState: React.Dispatch<React.SetStateAction<ListingFormState>>;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  loadingLabel: string;
}) {
  const { t } = useTranslation();
  const update = <K extends keyof ListingFormState>(key: K, value: ListingFormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));
  const showAmount = state.priceMode === 'fixed' || state.priceMode === 'hourly';
  const showRange = state.priceMode === 'hourly';
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field>
        <FieldLabel className="text-sm font-medium text-foreground">
          {t('listingForm.kind')}
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {LISTING_KINDS.map((k) => (
            <PillButton
              key={k}
              active={state.kind === k}
              disabled={loading}
              onClick={() => update('kind', k)}
            >
              {t(`listingForm.kinds.${k}`)}
            </PillButton>
          ))}
        </div>
        <FieldDescription>{t(`listingForm.kindHelp.${state.kind}`)}</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="title" className="text-sm font-medium text-foreground">
          {t('listingForm.title')}
        </FieldLabel>
        <Input
          id="title"
          value={state.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder={t('listingForm.titlePlaceholder')}
          disabled={loading}
          required
          maxLength={120}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="description" className="text-sm font-medium text-foreground">
          {t('listingForm.description')}
        </FieldLabel>
        <Textarea
          id="description"
          value={state.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder={t('listingForm.descriptionPlaceholder')}
          disabled={loading}
          required
          rows={6}
          maxLength={4000}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="category" className="text-sm font-medium text-foreground">
            {t('listingForm.category')}
          </FieldLabel>
          <Input
            id="category"
            value={state.category}
            onChange={(e) => update('category', e.target.value)}
            placeholder={t('listingForm.categoryPlaceholder')}
            disabled={loading}
            required
            maxLength={60}
          />
          <FieldDescription>{t('listingForm.categoryHelp')}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="city" className="text-sm font-medium text-foreground">
            {t('listingForm.city')}
          </FieldLabel>
          <Input
            id="city"
            value={state.city}
            onChange={(e) => update('city', e.target.value)}
            placeholder={t('listingForm.cityPlaceholder')}
            disabled={loading}
            maxLength={80}
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="tags" className="text-sm font-medium text-foreground">
          {t('listingForm.tags')}
        </FieldLabel>
        <Input
          id="tags"
          value={state.tags}
          onChange={(e) => update('tags', e.target.value)}
          placeholder={t('listingForm.tagsPlaceholder')}
          disabled={loading}
          maxLength={200}
        />
        <FieldDescription>{t('listingForm.tagsHelp')}</FieldDescription>
      </Field>

      <Field>
        <FieldLabel className="text-sm font-medium text-foreground">
          {t('listingForm.priceMode')}
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {PRICE_MODES.map((m) => (
            <PillButton
              key={m}
              active={state.priceMode === m}
              disabled={loading}
              onClick={() => update('priceMode', m)}
            >
              {t(`listingForm.priceModes.${m}`)}
            </PillButton>
          ))}
        </div>
      </Field>

      {showAmount && (
        <div className="grid gap-5 md:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="priceMin" className="text-sm font-medium text-foreground">
              {showRange ? t('listingForm.priceMin') : t('listingForm.priceAmount')}
            </FieldLabel>
            <Input
              id="priceMin"
              type="number"
              min={0}
              step="any"
              value={state.priceMin}
              onChange={(e) => update('priceMin', e.target.value)}
              disabled={loading}
              placeholder="0"
            />
          </Field>
          {showRange && (
            <Field>
              <FieldLabel htmlFor="priceMax" className="text-sm font-medium text-foreground">
                {t('listingForm.priceMax')}
              </FieldLabel>
              <Input
                id="priceMax"
                type="number"
                min={0}
                step="any"
                value={state.priceMax}
                onChange={(e) => update('priceMax', e.target.value)}
                disabled={loading}
                placeholder=""
              />
              <FieldDescription>{t('listingForm.priceMaxHelp')}</FieldDescription>
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="currency" className="text-sm font-medium text-foreground">
              {t('listingForm.currency')}
            </FieldLabel>
            <Input
              id="currency"
              value={state.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              maxLength={8}
              disabled={loading}
            />
          </Field>
        </div>
      )}

      {error && (
        <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </FieldError>
      )}

      <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
        {loading ? loadingLabel : submitLabel}
      </Button>
    </form>
  );
}
