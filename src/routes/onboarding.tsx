import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { getSession } from '@/lib/auth.server';
import { getProfile, upsertProfile } from '@/lib/profile.server';
import { profileSchema } from '@/lib/validation';
import { signOut } from '@/lib/auth-client';
import { webHapticsOptions } from '@/lib/web-haptics';
import { Card, CardContent } from '@/components/ui/card';
import { GradientOrbs } from '@/components/ui/background';
import { AuthHeader } from '@/components/AuthHeader';
import OnboardingForm, { type OnboardingFormState } from '@/components/onboarding/OnboardingForm';
const checkOnboardingStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const session = await getSession(request);
  if (!session) {
    throw redirect({ to: '/login', search: { redirect: undefined } });
  }
  const existing = await getProfile(session.user.id);
  if (existing) {
    throw redirect({ to: '/dashboard' });
  }
  return { userId: session.user.id };
});
const saveProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: OnboardingFormState) => data)
  .handler(async ({ data }) => {
    const request = getRequest();
    const session = await getSession(request);
    if (!session) {
      throw redirect({ to: '/login', search: { redirect: undefined } });
    }
    const parsed = profileSchema.safeParse({
      displayName: data.displayName,
      telegram: data.telegram,
      city: data.city || undefined,
      bio: data.bio || undefined,
    });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message);
    }
    await upsertProfile({
      userId: session.user.id,
      displayName: parsed.data.displayName,
      telegram: parsed.data.telegram,
      city: parsed.data.city,
      bio: parsed.data.bio,
    });
    throw redirect({ to: '/dashboard' });
  });
export const Route = createFileRoute('/onboarding')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  loader: () => checkOnboardingStatus(),
  component: OnboardingPage,
});
function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const [state, setState] = useState<OnboardingFormState>({
    displayName: '',
    telegram: '',
    city: '',
    bio: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: '/login', replace: true, search: { redirect: undefined } });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = profileSchema.safeParse({
      displayName: state.displayName,
      telegram: state.telegram,
      city: state.city || undefined,
      bio: state.bio || undefined,
    });
    if (!parsed.success) {
      trigger?.('error');
      setError(t(parsed.error.issues[0].message));
      return;
    }
    setLoading(true);
    try {
      await saveProfile({ data: state });
      await navigate({ to: '/dashboard' });
    } catch (err) {
      if (err instanceof Response || (err && typeof err === 'object' && 'to' in err)) {
        trigger?.('success');
        await navigate({ to: '/dashboard' });
        return;
      }
      trigger?.('error');
      setError(err instanceof Error ? t(err.message) : t('onboarding.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <div className="relative flex flex-1 items-center justify-center p-6">
        <GradientOrbs />

        <div className="relative z-10 w-full max-w-md">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <OnboardingForm
                state={state}
                setState={setState}
                loading={loading}
                error={error}
                onSubmit={handleSubmit}
                onSignOut={handleSignOut}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
