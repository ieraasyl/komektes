'use client';

import { useEffect, useState } from 'react';
import { CaretDownIcon, UserCircleIcon } from '@phosphor-icons/react';
import { Menu } from '@base-ui/react/menu';
import { useTranslation } from 'react-i18next';
import { useWebHaptics } from 'web-haptics/react';
import { supportedLngs, type SupportedLng } from '@/i18n';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme, type ThemeMode } from '@/lib/theme';
import { webHapticsOptions } from '@/lib/web-haptics';
import {
  preferenceOptionHighlight,
  preferenceOptionIdle,
  preferenceOptionSelectedHighlight,
} from '@/lib/header-preference-styles';

const SIGN_OUT_ARM_MS = 3000;

const menuItemClass =
  'flex cursor-default items-center gap-2 rounded-sm px-2 py-2 text-xs outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground';

const menuRadioItemBaseClass =
  'relative mx-0.5 my-0.5 flex min-h-8 cursor-default items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium outline-none select-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-50';

const menuRadioItemClass = cn(
  menuRadioItemBaseClass,
  preferenceOptionIdle,
  preferenceOptionHighlight,
  'data-checked:bg-card data-checked:text-foreground data-checked:shadow-sm data-checked:ring-1 data-checked:ring-black/5 dark:data-checked:ring-white/10',
  preferenceOptionSelectedHighlight,
);

const menuRadioLanguageClass = cn(menuRadioItemClass, 'uppercase');

function resolvedLanguage(i18nLanguage: string | undefined): SupportedLng {
  const raw = i18nLanguage ?? 'en';
  return supportedLngs.find((l) => raw === l || raw.startsWith(`${l}-`)) ?? 'en';
}

export type HeaderSettingsMenuProps = {
  /** When set with sign-out, shown at the top of the menu */
  accountEmail?: string | null;
  /** When set, menu includes two-step sign out */
  onSignOut?: () => void | Promise<void>;
  className?: string;
};

export function HeaderSettingsMenu({
  accountEmail,
  onSignOut,
  className,
}: HeaderSettingsMenuProps) {
  const { t, i18n } = useTranslation();
  const { trigger } = useWebHaptics(webHapticsOptions);
  const { mode, setThemeMode } = useTheme();
  const [signOutArmed, setSignOutArmed] = useState(false);
  const authed = Boolean(onSignOut);
  const showEmail = authed && Boolean(accountEmail?.trim());

  useEffect(() => {
    if (!signOutArmed) return;
    const id = window.setTimeout(() => setSignOutArmed(false), SIGN_OUT_ARM_MS);
    return () => window.clearTimeout(id);
  }, [signOutArmed]);

  const lng = resolvedLanguage(i18n.language);

  return (
    <Menu.Root
      modal
      onOpenChange={(open) => {
        if (!open) setSignOutArmed(false);
      }}
    >
      <Menu.Trigger
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'gap-1 pr-2 pl-2.5',
          className,
        )}
        aria-label={t('header.accountMenu')}
      >
        <UserCircleIcon weight="regular" className="size-4 shrink-0" aria-hidden />
        <CaretDownIcon weight="bold" className="size-3 shrink-0 opacity-70" aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50 outline-none">
          <Menu.Popup
            className={cn(
              'max-h-[min(var(--available-height),24rem)] w-60 origin-(--transform-anchor) overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none',
              'data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
              'data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
            )}
          >
            {showEmail ? (
              <>
                <Menu.Group>
                  <Menu.GroupLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    <span className="block truncate" title={accountEmail!}>
                      {accountEmail}
                    </span>
                  </Menu.GroupLabel>
                </Menu.Group>
                <Menu.Separator className="my-1 h-px bg-border" />
              </>
            ) : null}
            <Menu.Group>
              <Menu.GroupLabel className="px-2 py-1.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                {t('header.language')}
              </Menu.GroupLabel>
              <Menu.RadioGroup
                value={lng}
                onValueChange={(value: SupportedLng) => {
                  trigger?.('light');
                  void i18n.changeLanguage(value);
                }}
              >
                {supportedLngs.map((code) => (
                  <Menu.RadioItem key={code} value={code} className={menuRadioLanguageClass}>
                    {code}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            <Menu.Separator className="my-1 h-px bg-border" />
            <Menu.Group>
              <Menu.GroupLabel className="px-2 py-1.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                {t('header.appearance')}
              </Menu.GroupLabel>
              <Menu.RadioGroup
                value={mode}
                onValueChange={(value: ThemeMode) => {
                  trigger?.('light');
                  setThemeMode(value);
                }}
              >
                {(['light', 'dark', 'auto'] as const).map((m) => (
                  <Menu.RadioItem key={m} value={m} className={menuRadioItemClass}>
                    {t(`theme.${m}`)}
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Group>
            {authed ? (
              <>
                <Menu.Separator className="my-1 h-px bg-border" />
                <Menu.Item
                  closeOnClick={signOutArmed}
                  onClick={() => {
                    if (!signOutArmed) {
                      setSignOutArmed(true);
                      return;
                    }
                    void onSignOut!();
                  }}
                  className={cn(
                    menuItemClass,
                    signOutArmed && 'text-destructive data-highlighted:text-destructive',
                  )}
                >
                  {signOutArmed ? t('common.confirmAction') : t('nav.signOut')}
                </Menu.Item>
              </>
            ) : null}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
