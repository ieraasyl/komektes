'use client';

import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { signOut, useSession } from '@/lib/auth-client';
import { HeaderSettingsMenu } from '@/components/HeaderSettingsMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConfirmButton } from '@/components/ui/confirm-button';

export function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: '/' });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 justify-self-start">
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="flex min-w-0 shrink-0 cursor-pointer items-center gap-2"
            aria-label="komektes"
          >
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
            >
              k
            </span>
            <span className="hidden truncate text-lg font-semibold tracking-tight text-foreground sm:inline">
              komektes
            </span>
          </button>
        </div>
        <nav className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground sm:gap-8 sm:text-sm">
          <Link
            to="/browse"
            className="shrink-0 transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            {t('nav.browse')}
          </Link>
          {user ? (
            <Link
              to="/dashboard"
              className="shrink-0 transition-colors hover:text-foreground"
              activeProps={{ className: 'text-foreground' }}
            >
              {t('nav.dashboard')}
            </Link>
          ) : null}
        </nav>
        <div className="flex min-w-0 items-center justify-end justify-self-end gap-2 md:gap-3">
          <HeaderSettingsMenu
            accountEmail={user?.email}
            onSignOut={user ? handleSignOut : undefined}
            className="shrink-0 md:hidden"
          />
          <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
            <LanguageSwitcher size="sm" />
            <ThemeToggle size="sm" />
            {user ? (
              <>
                <span className="hidden max-w-40 truncate text-xs text-muted-foreground lg:inline">
                  {user.email}
                </span>
                <ConfirmButton
                  label={t('nav.signOut')}
                  confirmLabel={t('common.confirmAction')}
                  onConfirm={handleSignOut}
                  variant="outline"
                  size="sm"
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
