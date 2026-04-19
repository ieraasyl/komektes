import { z } from 'zod';
import { LISTING_KINDS, PRICE_MODES } from '@/db/schema';
const V = {
  emailRequired: 'validation.emailRequired',
  invalidEmail: 'validation.invalidEmail',
  codeMustBe6Digits: 'validation.codeMustBe6Digits',
  displayNameRequired: 'validation.displayNameRequired',
  displayNameMax: 'validation.displayNameMax',
  telegramRequired: 'validation.telegramRequired',
  telegramInvalid: 'validation.telegramInvalid',
  cityMax: 'validation.cityMax',
  bioMax: 'validation.bioMax',
  titleRequired: 'validation.titleRequired',
  titleMax: 'validation.titleMax',
  descriptionRequired: 'validation.descriptionRequired',
  descriptionMax: 'validation.descriptionMax',
  categoryRequired: 'validation.categoryRequired',
  categoryMax: 'validation.categoryMax',
  tagsMax: 'validation.tagsMax',
  priceModeInvalid: 'validation.priceModeInvalid',
  priceMinInvalid: 'validation.priceMinInvalid',
  priceMaxInvalid: 'validation.priceMaxInvalid',
  priceRangeInvalid: 'validation.priceRangeInvalid',
  priceRequired: 'validation.priceRequired',
  kindInvalid: 'validation.kindInvalid',
  ratingInvalid: 'validation.ratingInvalid',
  reviewTextMax: 'validation.reviewTextMax',
} as const;
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, { error: V.emailRequired })
    .pipe(z.email({ error: V.invalidEmail })),
});
export type EmailInput = z.infer<typeof emailSchema>;
export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, { error: V.codeMustBe6Digits })
    .regex(/^\d{6}$/, { error: V.codeMustBe6Digits }),
});
export type OtpInput = z.infer<typeof otpSchema>;
const telegramRegex = /^[a-zA-Z0-9_]{3,32}$/;
const telegramUrlPrefix = /^(https?:\/\/)?(t\.me\/|telegram\.me\/)/i;
export function normalizeTelegram(input: string): string {
  let v = input.trim();
  v = v.replace(telegramUrlPrefix, '');
  if (v.startsWith('@')) v = v.slice(1);
  return v.toLowerCase();
}
export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: V.displayNameRequired })
    .max(80, { error: V.displayNameMax }),
  telegram: z
    .string()
    .min(1, { error: V.telegramRequired })
    .transform(normalizeTelegram)
    .pipe(z.string().regex(telegramRegex, { error: V.telegramInvalid })),
  city: z
    .string()
    .trim()
    .max(80, { error: V.cityMax })
    .optional()
    .transform((v) => v || undefined),
  bio: z
    .string()
    .trim()
    .max(500, { error: V.bioMax })
    .optional()
    .transform((v) => v || undefined),
});
export type ProfileInput = z.infer<typeof profileSchema>;
const priceFields = z.object({
  priceMode: z.enum(PRICE_MODES, { error: V.priceModeInvalid }),
  priceMin: z
    .union([z.literal(''), z.coerce.number().min(0, { error: V.priceMinInvalid })])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : (v as number))),
  priceMax: z
    .union([z.literal(''), z.coerce.number().min(0, { error: V.priceMaxInvalid })])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : (v as number))),
  currency: z
    .string()
    .trim()
    .max(8)
    .optional()
    .transform((v) => v || 'KZT'),
});
export const listingSchema = z
  .object({
    kind: z.enum(LISTING_KINDS, { error: V.kindInvalid }),
    title: z.string().trim().min(1, { error: V.titleRequired }).max(120, { error: V.titleMax }),
    description: z
      .string()
      .trim()
      .min(1, { error: V.descriptionRequired })
      .max(4000, { error: V.descriptionMax }),
    category: z
      .string()
      .trim()
      .min(1, { error: V.categoryRequired })
      .max(60, { error: V.categoryMax }),
    tags: z
      .string()
      .trim()
      .max(200, { error: V.tagsMax })
      .optional()
      .transform((v) => v || ''),
    city: z
      .string()
      .trim()
      .max(80, { error: V.cityMax })
      .optional()
      .transform((v) => v || undefined),
  })
  .extend(priceFields.shape)
  .superRefine((val, ctx) => {
    if (val.priceMode === 'fixed' && val.priceMin === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceMin'],
        message: V.priceRequired,
      });
    }
    if (val.priceMode === 'hourly' && val.priceMin === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceMin'],
        message: V.priceRequired,
      });
    }
    if (val.priceMin !== undefined && val.priceMax !== undefined && val.priceMax < val.priceMin) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceMax'],
        message: V.priceRangeInvalid,
      });
    }
  });
export type ListingInput = z.infer<typeof listingSchema>;
export const reviewSchema = z.object({
  engagementId: z.string().min(1),
  rating: z.coerce
    .number()
    .int()
    .min(1, { error: V.ratingInvalid })
    .max(5, { error: V.ratingInvalid }),
  text: z
    .string()
    .trim()
    .max(1000, { error: V.reviewTextMax })
    .optional()
    .transform((v) => v || undefined),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
const BROWSE_KINDS = [...LISTING_KINDS, 'all'] as const;
const BROWSE_PRICE_MODES = [...PRICE_MODES, 'any'] as const;
export const browseFiltersSchema = z.object({
  q: z.string().trim().max(120).optional(),
  kind: z.enum(BROWSE_KINDS).optional(),
  category: z.string().trim().max(60).optional(),
  priceMode: z.enum(BROWSE_PRICE_MODES).optional(),
});
export type BrowseFilters = z.infer<typeof browseFiltersSchema>;
export function tagsToArray(tags: string | null | undefined): string[] {
  if (!tags) return [];
  return tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}
export function tagsFromInput(input: string | undefined): string {
  return tagsToArray(input).join(',');
}
export function buildPriceSummary(
  mode: (typeof PRICE_MODES)[number],
  min: number | undefined,
  max: number | undefined,
  currency: string,
): string | undefined {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  switch (mode) {
    case 'free':
      return 'Free';
    case 'negotiable':
      return 'Negotiable';
    case 'fixed':
      return min !== undefined ? `${fmt(min)} ${currency}` : undefined;
    case 'hourly': {
      if (min !== undefined && max !== undefined && max !== min)
        return `${fmt(min)}–${fmt(max)} ${currency}/hr`;
      if (min !== undefined) return `${fmt(min)} ${currency}/hr`;
      return undefined;
    }
  }
}
