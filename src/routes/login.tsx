import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { authClient, signIn } from '@/lib/auth-client';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/auth.server';
import { getProfile } from '@/lib/profile.server';
import { emailSchema, otpSchema } from '@/lib/validation';
import { webHapticsOptions } from '@/lib/web-haptics';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppHeader } from '@/components/AppHeader';
import EmailForm from '@/components/login/EmailForm';
import OtpForm from '@/components/login/OtpForm';
const getPostLoginDestination = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const session = await getSession(request);
  if (!session) return '/login';
  const profile = await getProfile(session.user.id);
  return profile ? '/dashboard' : '/onboarding';
});
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const destination = await getPostLoginDestination();
    if (destination === '/login') return;
    const safeRedirect = isSafeRedirect(search.redirect) ? search.redirect : undefined;
    if (destination === '/onboarding') {
      throw redirect({
        to: '/onboarding',
        search: { redirect: safeRedirect },
      });
    }
    throw redirect({ to: safeRedirect ?? '/dashboard' });
  },
  component: LoginPage,
});
function isSafeRedirect(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.startsWith('/api/')
  );
}
const RESEND_COOLDOWN = 60;
function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const [phase, setPhase] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);
  const handleSendOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const parsed = emailSchema.safeParse({ email });
      if (!parsed.success) {
        trigger?.('error');
        setError(t(parsed.error.issues[0].message));
        return;
      }
      setOtpLoading(true);
      try {
        const result = await authClient.emailOtp.sendVerificationOtp({
          email,
          type: 'sign-in',
        });
        if (result.error) {
          trigger?.('error');
          setError(result.error.message ?? t('login.sendCodeFailed'));
        } else {
          trigger?.('success');
          setPhase('otp');
          setCooldown(RESEND_COOLDOWN);
        }
      } catch (err) {
        trigger?.('error');
        setError(
          `${t('login.errorLabel')}: ${err instanceof Error ? err.message : t('login.unknownError')}`,
        );
      } finally {
        setOtpLoading(false);
      }
    },
    [email, t, trigger],
  );
  const handleVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      const parsed = otpSchema.safeParse({ otp });
      if (!parsed.success) {
        trigger?.('error');
        setError(t(parsed.error.issues[0].message));
        return;
      }
      setOtpLoading(true);
      try {
        const result = await signIn.emailOtp({ email, otp });
        if (result.error) {
          trigger?.('error');
          setError(result.error.message ?? t('login.invalidCode'));
        } else {
          trigger?.('success');
          const destination = await getPostLoginDestination();
          const safeRedirect = isSafeRedirect(redirect) ? redirect : undefined;
          if (destination === '/onboarding') {
            await navigate({ to: '/onboarding', search: { redirect: safeRedirect } });
          } else {
            await navigate({ to: safeRedirect ?? '/dashboard' });
          }
        }
      } catch (err) {
        trigger?.('error');
        setError(
          `${t('login.errorLabel')}: ${err instanceof Error ? err.message : t('login.unknownError')}`,
        );
      } finally {
        setOtpLoading(false);
      }
    },
    [email, otp, navigate, redirect, t, trigger],
  );
  const handleResend = useCallback(async () => {
    setError(null);
    setOtpLoading(true);
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      if (result.error) {
        trigger?.('error');
        setError(result.error.message ?? t('login.resendFailed'));
      } else {
        trigger?.('success');
        setCooldown(RESEND_COOLDOWN);
      }
    } catch (err) {
      trigger?.('error');
      setError(
        `${t('login.errorLabel')}: ${err instanceof Error ? err.message : t('login.unknownError')}`,
      );
    } finally {
      setOtpLoading(false);
    }
  }, [email, t, trigger]);
  const handleBack = useCallback(() => {
    setPhase('email');
    setOtp('');
    setError(null);
  }, []);
  const handleGoogleSignIn = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const callbackURL = isSafeRedirect(redirect) ? redirect : '/dashboard';
      await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });
    } catch (err) {
      trigger?.('error');
      setError(
        `${t('login.errorLabel')}: ${err instanceof Error ? err.message : t('login.unknownError')}`,
      );
      setGoogleLoading(false);
    }
  }, [redirect, t, trigger]);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="relative z-10 w-full max-w-sm">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              {phase === 'email' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                    className="mb-4 w-full"
                  >
                    <img
                      src="/images/google.svg"
                      alt=""
                      className="mr-2 h-5 w-5 shrink-0"
                      aria-hidden
                    />
                    {googleLoading ? t('login.redirecting') : t('login.signInWithGoogle')}
                  </Button>
                  <div className="relative my-5 flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">{t('login.or')}</span>
                    <Separator className="flex-1" />
                  </div>
                  <EmailForm
                    email={email}
                    setEmail={setEmail}
                    loading={otpLoading}
                    error={error}
                    onSubmit={handleSendOtp}
                  />
                </>
              ) : (
                <OtpForm
                  otp={otp}
                  setOtp={setOtp}
                  email={email}
                  loading={otpLoading}
                  error={error}
                  cooldown={cooldown}
                  onSubmit={handleVerifyOtp}
                  onResend={handleResend}
                  onBack={handleBack}
                />
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Button variant="link" size="xs" onClick={() => navigate({ to: '/' })}>
              {t('login.backToHome')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
