import type { CSSProperties } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { useTranslation } from 'react-i18next';
import {
  ArrowRightIcon,
  HandHeartIcon,
  HandshakeIcon,
  PaperPlaneTiltIcon,
  SparkleIcon,
  StarIcon,
} from '@phosphor-icons/react';
import { getSession } from '@/lib/auth.server';
import { browseListings } from '@/lib/listings.server';
import { AuthHeader } from '@/components/AuthHeader';
import { GradientOrbs } from '@/components/ui/background';
import { Button } from '@/components/ui/button';
const loadLanding = createServerFn({ method: 'GET' }).handler(async () => {
  const request = getRequest();
  const [session, listings] = await Promise.all([getSession(request), browseListings({})]);
  const slim = listings.slice(0, 12).map((l) => ({
    id: l.id,
    kind: l.kind,
    title: l.title,
    city: l.city,
    priceSummary: l.priceSummary,
    priceMode: l.priceMode,
    authorName: l.author?.displayName ?? null,
  }));
  return { session, listings: slim };
});
export const Route = createFileRoute('/')({
  loader: () => loadLanding(),
  component: LandingPage,
});
type RibbonItem = {
  id: string;
  kind: 'offer' | 'request';
  title: string;
  city: string | null;
  price: string;
  authorName: string | null;
};
function LandingPage() {
  const { session, listings } = Route.useLoaderData();
  const { t } = useTranslation();
  const dashboardHref = session ? '/dashboard' : '/login';
  const ribbon: RibbonItem[] = listings.map((l) => ({
    id: l.id,
    kind: l.kind,
    title: l.title,
    city: l.city,
    price: l.priceSummary ?? t(`listingForm.priceModes.${l.priceMode}`),
    authorName: l.authorName,
  }));
  const shouldAnimate = ribbon.length >= 4;
  const marqueeItems = shouldAnimate ? [...ribbon, ...ribbon] : ribbon;
  const marqueeDuration = `${Math.max(28, ribbon.length * 5)}s`;
  const steps = [
    { key: 1, icon: PaperPlaneTiltIcon },
    { key: 2, icon: HandshakeIcon },
    { key: 3, icon: StarIcon },
  ] as const;
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <GradientOrbs />
      <AuthHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-12 pb-20 md:pt-20">
        <section className="grid gap-12 md:grid-cols-[minmax(0,1fr)_360px] md:items-center md:gap-16">
          <div className="text-center md:text-left">
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <HandHeartIcon weight="fill" className="size-3.5" />
              {t('brand.tagline')}
            </span>
            <h1 className="mb-6 text-4xl leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {t('landing.heroTitle')}
            </h1>
            <p className="mb-8 max-w-xl text-base text-muted-foreground md:text-lg">
              {t('landing.heroSubtitle')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <Button size="lg" render={<Link to="/browse" />}>
                {t('landing.ctaBrowse')}
              </Button>
              <Button size="lg" variant="outline" render={<Link to={dashboardHref} />}>
                {session ? t('nav.dashboard') : t('landing.ctaPost')}
              </Button>
            </div>
          </div>

          <LiveRibbon
            items={marqueeItems}
            duration={marqueeDuration}
            animate={shouldAnimate}
            label={t('landing.liveLabel')}
            viewAllText={t('landing.viewAll')}
            emptyTitle={t('landing.emptyTitle')}
            emptyDesc={t('landing.emptyDesc')}
            emptyCta={t('landing.ctaPost')}
            emptyCtaHref={dashboardHref}
          />
        </section>

        <section className="mt-24 md:mt-32">
          <h2 className="mb-12 text-center text-2xl font-bold tracking-tight text-foreground">
            {t('landing.howTitle')}
          </h2>

          <div className="relative mx-auto max-w-4xl">
            <div
              aria-hidden
              className="absolute top-6 left-[12%] hidden h-px w-[76%] bg-border md:block"
            />

            <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map(({ key, icon: Icon }) => (
                <li key={key} className="text-center md:text-left">
                  <div className="relative mx-auto mb-4 flex size-12 items-center justify-center bg-background md:mx-0">
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground ring-8 ring-background">
                      <Icon weight="bold" className="size-5" />
                    </span>
                    <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-card text-[10px] font-bold tracking-wider text-muted-foreground ring-1 ring-border md:-top-1 md:right-auto md:left-9">
                      {String(key).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-foreground">
                    {t(`landing.howStep${key}Title`)}
                  </h3>
                  <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground md:mx-0">
                    {t(`landing.howStep${key}Desc`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <footer className="mt-24 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <p className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              {t('footer.terms')}
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
function LiveRibbon({
  items,
  duration,
  animate,
  label,
  viewAllText,
  emptyTitle,
  emptyDesc,
  emptyCta,
  emptyCtaHref,
}: {
  items: RibbonItem[];
  duration: string;
  animate: boolean;
  label: string;
  viewAllText: string;
  emptyTitle: string;
  emptyDesc: string;
  emptyCta: string;
  emptyCtaHref: string;
}) {
  const isEmpty = items.length === 0;
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card/60 p-4 shadow-[0_1px_0_oklch(1_0_0/0.4)_inset,0_20px_50px_-20px_oklch(0.2_0.02_250/0.18)] backdrop-blur md:justify-self-end">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-offer opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-offer" />
          </span>
          {label}
        </span>
        {!isEmpty && (
          <Link
            to="/browse"
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            {viewAllText}
          </Link>
        )}
      </div>

      {isEmpty ? (
        <RibbonEmpty
          title={emptyTitle}
          desc={emptyDesc}
          ctaLabel={emptyCta}
          ctaHref={emptyCtaHref}
        />
      ) : (
        <div className="marquee-mask relative h-[420px] overflow-hidden">
          <ul
            className={`flex flex-col gap-2 ${animate ? 'marquee-y' : ''}`}
            style={{ '--marquee-duration': duration } as CSSProperties}
          >
            {items.map((item, idx) => (
              <RibbonRow key={`${item.id}-${idx}`} item={item} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
function RibbonEmpty({
  title,
  desc,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  desc: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <SparkleIcon weight="fill" className="size-5" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
      <Link
        to={ctaHref}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {ctaLabel}
        <ArrowRightIcon weight="bold" className="size-3" />
      </Link>
    </div>
  );
}
function RibbonRow({ item }: { item: RibbonItem }) {
  const isOffer = item.kind === 'offer';
  const dotClass = isOffer ? 'bg-brand-offer' : 'bg-brand-request';
  const tagClass = isOffer
    ? 'bg-brand-offer-soft text-brand-offer'
    : 'bg-brand-request-soft text-brand-request';
  const meta = [item.authorName, item.city].filter(Boolean).join(' · ');
  return (
    <li>
      <Link
        to="/listings/$id"
        params={{ id: item.id }}
        className="group/row flex items-start gap-3 rounded-lg border border-transparent p-2.5 no-underline transition-colors hover:border-primary/30 hover:bg-primary/5"
      >
        <span
          aria-hidden
          className={`mt-1.5 inline-block size-2 shrink-0 rounded-full ${dotClass}`}
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug font-medium text-foreground">
            {item.title}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tagClass}`}>
              {isOffer ? '↑' : '↓'} {item.price}
            </span>
            {meta && <span className="truncate">{meta}</span>}
          </div>
        </div>
        <ArrowRightIcon
          weight="bold"
          className="mt-2 size-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover/row:text-primary"
        />
      </Link>
    </li>
  );
}
