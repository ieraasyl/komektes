import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@tanstack/react-router';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
export default function DashboardHeader({
  email,
  onSignOut,
}: {
  email: string;
  onSignOut: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="flex cursor-pointer items-center gap-2"
        >
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            k
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">komektes</span>
        </button>
        <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
          <Link
            to="/browse"
            className="transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            {t('nav.browse')}
          </Link>
          <Link
            to="/dashboard"
            className="transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            {t('nav.dashboard')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <span className="hidden text-xs text-muted-foreground sm:inline">{email}</span>
          <ConfirmButton
            label={t('nav.signOut')}
            confirmLabel={t('common.confirmAction')}
            onConfirm={onSignOut}
            variant="outline"
            size="sm"
          />
        </div>
      </div>
    </header>
  );
}
