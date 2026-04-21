import type { ListingFormState } from '@/components/listings/ListingForm';

export const emptyListingForm: ListingFormState = {
  kind: 'offer',
  title: '',
  description: '',
  category: '',
  tags: '',
  city: '',
  priceMode: 'negotiable',
  priceMin: '',
  priceMax: '',
  currency: 'KZT',
};
