import { useTranslation } from 'react-i18next';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { Separator } from '@/components/ui/separator';
export default function OtpForm({
  otp,
  setOtp,
  email,
  loading,
  error,
  cooldown,
  onSubmit,
  onResend,
  onBack,
}: {
  otp: string;
  setOtp: (v: string) => void;
  email: string;
  loading: boolean;
  error: string | null;
  cooldown: number;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <CardTitle className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
        {t('login.verificationCode')}
      </CardTitle>
      <CardDescription className="mb-6 text-sm text-muted-foreground">
        {t('login.verificationDesc')} <span className="font-medium text-foreground">{email}</span>
      </CardDescription>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field>
          <FieldLabel htmlFor="otp" className="sr-only text-sm font-medium text-foreground">
            {t('login.code')}
          </FieldLabel>
          <InputOTP
            id="otp"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={otp}
            onChange={(val) => setOtp(val)}
            disabled={loading}
            autoFocus
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator className="text-muted-foreground" />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </Field>

        {error && (
          <FieldError className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </FieldError>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
          {loading ? t('login.verifying') : t('login.verifySignIn')}
        </Button>
      </form>

      <Separator className="my-4" />

      <div className="flex items-center justify-between text-sm">
        <Button variant="link" size="xs" onClick={onBack}>
          {t('login.differentEmail')}
        </Button>
        <Button variant="link" size="xs" disabled={cooldown > 0 || loading} onClick={onResend}>
          {cooldown > 0 ? t('login.resendIn', { seconds: cooldown }) : t('login.resendCode')}
        </Button>
      </div>
    </>
  );
}
