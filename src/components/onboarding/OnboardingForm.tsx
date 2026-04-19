import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
export type OnboardingFormState = {
  displayName: string;
  telegram: string;
  city: string;
  bio: string;
};
export default function OnboardingForm({
  state,
  setState,
  loading,
  error,
  onSubmit,
  onSignOut,
}: {
  state: OnboardingFormState;
  setState: React.Dispatch<React.SetStateAction<OnboardingFormState>>;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  const update = <K extends keyof OnboardingFormState>(key: K, value: OnboardingFormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));
  return (
    <>
      <CardTitle className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
        {t('onboarding.completeProfile')}
      </CardTitle>
      <CardDescription className="mb-6 text-sm text-muted-foreground">
        {t('onboarding.completeProfileDesc')}
      </CardDescription>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="displayName" className="text-sm font-medium text-foreground">
            {t('onboarding.displayName')}
          </FieldLabel>
          <Input
            id="displayName"
            type="text"
            placeholder={t('onboarding.displayNamePlaceholder')}
            value={state.displayName}
            onChange={(e) => update('displayName', e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="telegram" className="text-sm font-medium text-foreground">
            {t('onboarding.telegram')}
          </FieldLabel>
          <Input
            id="telegram"
            type="text"
            placeholder={t('onboarding.telegramPlaceholder')}
            value={state.telegram}
            onChange={(e) => update('telegram', e.target.value)}
            required
            disabled={loading}
          />
          <FieldDescription>{t('onboarding.telegramHelp')}</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="city" className="text-sm font-medium text-foreground">
            {t('onboarding.city')}
          </FieldLabel>
          <Input
            id="city"
            type="text"
            placeholder={t('onboarding.cityPlaceholder')}
            value={state.city}
            onChange={(e) => update('city', e.target.value)}
            disabled={loading}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="bio" className="text-sm font-medium text-foreground">
            {t('onboarding.bio')}
          </FieldLabel>
          <Textarea
            id="bio"
            placeholder={t('onboarding.bioPlaceholder')}
            value={state.bio}
            onChange={(e) => update('bio', e.target.value)}
            disabled={loading}
            rows={3}
          />
          <FieldDescription>{t('onboarding.bioHelp')}</FieldDescription>
        </Field>

        {error && (
          <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </FieldError>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading ? t('onboarding.saving') : t('onboarding.submit')}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button type="button" variant="link" size="xs" onClick={onSignOut}>
          {t('onboarding.signOutDifferent')}
        </Button>
      </div>
    </>
  );
}
