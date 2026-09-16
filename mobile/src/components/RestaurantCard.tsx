import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodImage } from './FoodImage';
import { colors, radius, shadow, spacing, type } from '../theme/theme';
import type { Restaurant } from '../api/types';

/**
 * Image-led restaurant card, shared by the customer and owner views.
 * The photo does the visual work; text underneath stays quiet and readable.
 */
export function RestaurantCard({
  restaurant,
  onPress,
  testID,
}: {
  restaurant: Pick<Restaurant, 'name' | 'foodType' | 'description' | 'imageUrl'>;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressTo = (value: number) =>
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();

  return (
    <Animated.View style={[styles.shadowWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => pressTo(0.985)}
        onPressOut={() => pressTo(1)}
        accessibilityRole="button"
        accessibilityLabel={`${restaurant.name}, ${restaurant.foodType}`}
        testID={testID}
        style={styles.card}
      >
        <FoodImage
          path={restaurant.imageUrl}
          name={restaurant.name}
          toneKey={restaurant.foodType}
          style={styles.cover}
          initialSize={56}
        />

        <View style={styles.body}>
          <Text style={type.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={[type.meta, styles.cuisine]} numberOfLines={1}>
            {restaurant.foodType}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {restaurant.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The shadow sits on an outer view: clipping the rounded image on the same
  // view would clip the shadow along with it.
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
  cover: { width: '100%', aspectRatio: 16 / 9 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  cuisine: { marginTop: 2, color: colors.primaryDark },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.sm },
});
