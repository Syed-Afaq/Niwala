/**
 * Niwala design tokens. Every colour, size and shadow used in the app comes
 * from here - components should not contain raw hex values.
 *
 * Orange is the accent for primary actions and state, not the whole identity:
 * most of the interface is warm neutrals, with photography carrying the colour.
 */
export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  primary: '#E85D04',
  primaryDark: '#C2410C',
  primarySoft: '#FFF1E8',
  /** Text and icons placed on a primary-coloured surface. */
  onPrimary: '#FFFFFF',
  text: '#18181B',
  textMuted: '#71717A',
  border: '#E7E5E4',
  success: '#16A34A',
  successSoft: '#ECFDF3',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  errorBorder: '#FECACA',
  warning: '#B45309',
  warningSoft: '#FEF6E7',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Kept deliberately modest - cards are not pills. */
export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
} as const;

/**
 * Type scale.
 *   title       page titles            30 / bold
 *   heading     section headings       21 / semibold
 *   name        restaurant, meal names 18 / semibold
 *   subheading  smaller emphasised     17 / semibold
 *   body        running text           15
 *   muted/meta  dates, tags, captions  13
 */
export const type = {
  title: { fontSize: 30, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.4 },
  heading: { fontSize: 21, fontWeight: '600' as const, color: colors.text, letterSpacing: -0.2 },
  name: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  subheading: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 21 },
  muted: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  meta: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
} as const;

/** One soft elevation, used sparingly on cards that sit on the background. */
export const shadow = {
  card: { boxShadow: '0px 1px 2px rgba(24, 24, 27, 0.05), 0px 6px 16px rgba(24, 24, 27, 0.05)' },
} as const;

/**
 * Muted tones for image placeholders. A restaurant without a photo gets a
 * tone chosen from its cuisine, so the same cuisine always looks the same.
 */
export const placeholderTones = [
  { background: '#F3E6DA', foreground: '#9A5B2E' },
  { background: '#E6EBE1', foreground: '#4F6B45' },
  { background: '#F2E3E1', foreground: '#8C4A43' },
  { background: '#E5E8EC', foreground: '#4D5868' },
  { background: '#F4EBD5', foreground: '#86661E' },
  { background: '#ECE4E8', foreground: '#6E4D5E' },
] as const;

export function toneFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.toLowerCase().charCodeAt(i)) | 0;
  }
  return placeholderTones[Math.abs(hash) % placeholderTones.length];
}

/**
 * Prices arrive as exact decimal strings such as "1250" or "12.5" and are shown
 * in Pakistani rupees: whole amounts without decimals (Rs. 1,250), anything
 * with paisa to two places (Rs. 12.50).
 *
 * Grouping is done by hand rather than with Intl so the output is identical on
 * every device and JavaScript engine.
 */
export function formatPrice(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(2);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `Rs. ${fraction ? `${grouped}.${fraction}` : grouped}`;
}
