/**
 * Shared visuals for language / theme preference controls (desktop segmented control + mobile menu radios).
 */
export const preferenceOptionSelected =
  'bg-card text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10';

export const preferenceOptionIdle = 'text-muted-foreground hover:text-foreground';

/** Keyboard / pointer highlight when not the active value */
export const preferenceOptionHighlight =
  'data-highlighted:bg-accent data-highlighted:text-accent-foreground';

/** Keep selected chip look when row is both checked and highlighted */
export const preferenceOptionSelectedHighlight =
  'data-checked:data-highlighted:bg-card data-checked:data-highlighted:text-foreground data-checked:data-highlighted:shadow-sm data-checked:data-highlighted:ring-1 data-checked:data-highlighted:ring-black/5 dark:data-checked:data-highlighted:ring-white/10';
