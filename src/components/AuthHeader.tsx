import { useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
export function AuthHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="flex cursor-pointer items-center gap-2"
          aria-label="komektes"
        >
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            k
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">komektes</span>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          <Link
            to="/browse"
            className="transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            {t('nav.browse')}
          </Link>
        </nav>
        <LanguageSwitcher size="sm" />
      </div>
    </header>
  );
}
