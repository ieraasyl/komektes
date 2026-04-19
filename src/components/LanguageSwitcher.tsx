import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { supportedLngs } from '@/i18n';
import { webHapticsOptions } from '@/lib/web-haptics';
type LanguageSwitcherProps = {
  onLanguageChange?: () => void;
  size?: 'sm' | 'md';
  className?: string;
};
export function LanguageSwitcher({
  onLanguageChange,
  size = 'sm',
  className = '',
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const changeLanguage = (lng: string) => {
    trigger?.('light');
    i18n.changeLanguage(lng);
    onLanguageChange?.();
  };
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div
      className={`inline-flex items-center rounded-full bg-muted/60 p-0.5 ${className}`}
      role="group"
      aria-label={t('common.switchLanguage')}
    >
      {supportedLngs.map((lng) => {
        const active = i18n.language === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => changeLanguage(lng)}
            className={`${sizeClasses} cursor-pointer rounded-full font-medium uppercase transition-colors ${
              active
                ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={active}
            aria-label={`${t('common.switchLanguage')} — ${lng.toUpperCase()}`}
          >
            {lng.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
