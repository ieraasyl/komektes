'use client';

import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { supportedLngs, type SupportedLng } from '@/i18n';
import {
  preferenceOptionIdle,
  preferenceOptionSelected,
} from '@/lib/header-preference-styles';
import { cn } from '@/lib/utils';
import { webHapticsOptions } from '@/lib/web-haptics';

function activeLng(i18nLanguage: string | undefined): SupportedLng {
  const raw = i18nLanguage ?? 'en';
  return supportedLngs.find((l) => raw === l || raw.startsWith(`${l}-`)) ?? 'en';
}

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
  const current = activeLng(i18n.language);
  const changeLanguage = (lng: SupportedLng) => {
    trigger?.('light');
    void i18n.changeLanguage(lng);
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
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => changeLanguage(lng)}
            className={cn(
              sizeClasses,
              'cursor-pointer rounded-full font-medium uppercase transition-colors',
              active ? preferenceOptionSelected : preferenceOptionIdle,
            )}
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
