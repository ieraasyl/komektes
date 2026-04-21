import type { QueryClient } from '@tanstack/react-query';
import type { ErrorComponentProps } from '@tanstack/react-router';
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
} from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { useTranslation } from 'react-i18next';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/ui/button';
import { GradientOrbs } from '@/components/ui/background';
import i18n from '@/i18n';
import appCss from '@/styles.css?url';
const getServerLocale = createServerFn({ method: 'GET' }).handler(async () => {
  return getCookie('locale') || 'en';
});
function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <div className="relative flex flex-1 items-center justify-center p-6">
        <GradientOrbs />
        <div className="relative z-10 max-w-xl text-center">
          <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t('notFound.error')}
          </p>
          <h1 className="mb-4 text-7xl leading-none font-extrabold tracking-tight text-foreground md:text-8xl">
            404
          </h1>
          <p className="mb-8 text-base text-muted-foreground">{t('notFound.message')}</p>
          <Button size="lg" onClick={() => navigate({ to: '/' })}>
            {t('notFound.goHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
function RootErrorPage({ error, reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthHeader />
      <div className="relative flex flex-1 items-center justify-center p-6">
        <GradientOrbs />
        <div className="relative z-10 max-w-xl text-center">
          <p className="mb-4 text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t('errorPage.title')}
          </p>
          <div className="mb-8 space-y-4">
            <p className="text-base text-foreground">{t('errorPage.message')}</p>
            {import.meta.env.DEV && (
              <p className="font-mono text-sm wrap-break-word text-destructive">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={() => reset()}>
              {t('errorPage.retry')}
            </Button>
            <Button onClick={() => navigate({ to: '/' })}>{t('errorPage.goHome')}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  notFoundComponent: NotFoundPage,
  errorComponent: RootErrorPage,
  beforeLoad: async () => {
    const locale = await getServerLocale();
    if (i18n.language !== locale) {
      await i18n.changeLanguage(locale);
    }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'komektes | neighbour-to-neighbour help' },
      {
        name: 'description',
        content:
          'Post what you can do or what you need. Listings live here; you hash out details on Telegram.',
      },
      { name: 'theme-color', content: '#3aa6c2' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  shellComponent: RootDocument,
});
function RootDocument({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  return (
    <html lang={i18n.language || 'en'}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
