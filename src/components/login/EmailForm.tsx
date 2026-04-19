import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
export default function EmailForm({
  email,
  setEmail,
  loading,
  error,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <CardTitle className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
        {t('login.signIn')}
      </CardTitle>
      <CardDescription className="mb-6 text-sm text-muted-foreground">
        {t('login.signInDesc')}
      </CardDescription>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="email" className="text-sm font-medium text-foreground">
            {t('login.email')}
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            autoFocus
          />
        </Field>

        {error && (
          <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </FieldError>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading ? t('login.sendingCode') : t('login.continue')}
        </Button>
      </form>
    </>
  );
}
