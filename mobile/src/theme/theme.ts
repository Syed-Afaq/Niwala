/**
 * One source of truth for colour, spacing and type.
 * Warm and food-focused rather than the usual blue-grey app palette.
 */
export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  primary: '#E85D04',
  primaryDark: '#C2410C',
  primarySoft: '#FDF1E7',
  text: '#171717',
  textMuted: '#737373',
  border: '#E7E5E4',
  success: '#16A34A',
  successSoft: '#ECFDF3',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
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

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const type = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  subheading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
} as const;

/** Prices arrive as exact decimal strings such as "11.5" — show them as money. */
export function formatPrice(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : String(value);
}
