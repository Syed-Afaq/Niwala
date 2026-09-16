import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/theme';

/**
 * Top padding for screens that hide the navigation header. Without the safe
 * area inset their titles would sit under the status bar or the notch.
 */
export function useHeaderlessTopPadding(extra: number = spacing.xl): number {
  return useSafeAreaInsets().top + extra;
}
