import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, formatPrice, spacing, type } from '../theme/theme';

const DOT = ' \u00B7 ';

/**
 * Pinned summary of the cart, shown only while it has something in it.
 * Quiet by design: the menu is the focus, this just keeps checkout one tap away.
 */
export function CartSummaryBar({
  itemCount,
  total,
  restaurantName,
  onViewCart,
}: {
  itemCount: number;
  total: number;
  /** Shown when the cart belongs to a different restaurant than this screen. */
  restaurantName?: string;
  onViewCart: () => void;
}) {
  if (itemCount <= 0) return null;

  return (
    <View style={styles.bar}>
      <View style={styles.summary}>
        <Text style={type.subheading} numberOfLines={1} testID="cart-summary">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
          {DOT}
          {formatPrice(total)}
        </Text>
        {restaurantName ? (
          <Text style={type.muted} numberOfLines={1}>
            From {restaurantName}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onViewCart}
        accessibilityRole="button"
        testID="view-cart"
        style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
      >
        <Text style={styles.buttonText}>View cart</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summary: { flex: 1 },
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { backgroundColor: colors.primaryDark },
  buttonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '600' },
});
