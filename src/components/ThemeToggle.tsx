'use client';

import { DesktopIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useTheme, type ThemeMode } from '@/lib/theme';

const ICON_BY_MODE: Record<ThemeMode, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  auto: DesktopIcon,
};

type ThemeToggleProps = {
  size?: 'sm' | 'md';
  className?: string;
};

export function ThemeToggle({ size = 'sm', className = '' }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { mode, cycleThemeMode } = useTheme();

  const Icon = ICON_BY_MODE[mode];
  const currentLabel = t(`theme.${mode}`);
  const ariaLabel = `${t('theme.switchTheme')} — ${currentLabel}`;

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      onClick={cycleThemeMode}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`rounded-full ${className}`}
    >
      <Icon weight="regular" aria-hidden />
      <span className="sr-only">{currentLabel}</span>
    </Button>
  );
}
