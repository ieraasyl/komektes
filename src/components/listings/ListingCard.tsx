import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MapPinIcon } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { tagsToArray } from '@/lib/validation';
import type { ListingWithAuthor } from '@/lib/listings.server';
export default function ListingCard({ listing }: { listing: ListingWithAuthor }) {
  const { t } = useTranslation();
  const tags = tagsToArray(listing.tags).slice(0, 4);
  return (
    <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            className={
              listing.kind === 'offer'
                ? 'bg-brand-offer-soft text-brand-offer'
                : 'bg-brand-request-soft text-brand-request'
            }
          >
            {t(`listingForm.kinds.${listing.kind}`)}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {listing.category}
          </Badge>
          {listing.city && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <MapPinIcon weight="fill" />
              {listing.city}
            </Badge>
          )}
        </div>

        <Link
          to="/listings/$id"
          params={{ id: listing.id }}
          className="text-lg leading-snug font-semibold text-foreground transition-colors hover:text-primary"
        >
          {listing.title}
        </Link>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {listing.description}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {listing.priceSummary ?? t(`listingForm.priceModes.${listing.priceMode}`)}
          </span>
          {listing.author && (
            <span className="text-xs">
              {t('listingDetail.byAuthor', { name: listing.author.displayName })}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs text-muted-foreground">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
