import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodImage } from './FoodImage';
import { colors, formatPrice, radius, shadow, spacing, type } from '../theme/theme';
import type { Meal } from '../api/types';

/** Plus sign drawn from views, in the same style as the other in-app glyphs. */
function PlusGlyph({ color }: { color: string }) {
  return (
    <View style={styles.glyph}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.barVertical, { backgroundColor: color }]} />
    </View>
  );
}

/**
 * A menu item with a photo large enough to sell the dish. Used on the
 * customer menu; the add button is optional so owner views can reuse the card.
 */
export function MealCard({
  meal,
  toneKey,
  quantityInCart = 0,
  onAdd,
  actions,
  testID,
}: {
  meal: Pick<Meal, 'name' | 'description' | 'price' | 'imageUrl'>;
  /** Placeholder colour source, usually the restaurant cuisine. */
  toneKey: string;
  quantityInCart?: number;
  onAdd?: () => void;
  /** Replaces the add button, e.g. edit and delete links in the owner view. */
  actions?: React.ReactNode;
  testID?: string;
}) {
  const bump = useRef(new Animated.Value(1)).current;

  function handleAdd() {
    // A small pulse confirms the tap without moving anything else on screen.
    bump.setValue(0.86);
    Animated.spring(bump, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }).start();
    onAdd?.();
  }

  return (
    <View style={styles.shadowWrap} testID={testID}>
      <View style={styles.card}>
        <FoodImage
          path={meal.imageUrl}
          name={meal.name}
          toneKey={toneKey}
          style={styles.photo}
          initialSize={48}
        />

        <View style={styles.body}>
          <Text style={type.name} numberOfLines={2}>
            {meal.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {meal.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>{formatPrice(meal.price)}</Text>
              {quantityInCart > 0 ? (
                <Text style={styles.inCart}>{quantityInCart} in cart</Text>
              ) : null}
            </View>

            {onAdd ? (
              <Animated.View style={{ transform: [{ scale: bump }] }}>
                <Pressable
                  onPress={handleAdd}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${meal.name} to cart`}
                  testID={testID ? `${testID}-add` : undefined}
                  style={({ pressed }) => [styles.add, pressed ? styles.addPressed : null]}
                >
                  <PlusGlyph color={colors.onPrimary} />
                </Pressable>
              </Animated.View>
            ) : null}
            {actions ?? null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  photo: { width: '100%', aspectRatio: 16 / 10 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  priceBlock: { flexShrink: 1 },
  price: { fontSize: 17, fontWeight: '700', color: colors.text },
  inCart: { ...type.meta, color: colors.primaryDark, marginTop: 2 },
  add: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: { backgroundColor: colors.primaryDark },
  glyph: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', width: 16, height: 2.4, borderRadius: 1.2 },
  barVertical: { transform: [{ rotate: '90deg' }] },
});
