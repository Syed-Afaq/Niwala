import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { useCart } from '../../cart/CartContext';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';
import type { Meal } from '../../api/types';

export function RestaurantDetailScreen({
  restaurantId,
  onViewCart,
}: {
  restaurantId: string;
  onViewCart: () => void;
}) {
  const cart = useCart();
  const [notice, setNotice] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantApi.get(restaurantId).then((r) => r.restaurant),
  });

  if (query.isPending) {
    return <Loading label="Loading menu" />;
  }

  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
      </View>
    );
  }

  const restaurant = query.data;
  const meals = restaurant.meals ?? [];

  function handleAdd(meal: Meal) {
    const replacing = cart.conflictsWith(restaurant.id);
    cart.add({ id: restaurant.id, name: restaurant.name }, meal);
    setNotice(
      replacing
        ? `Your cart was replaced — it can only hold one restaurant at a time. Added ${meal.name}.`
        : `Added ${meal.name}.`
    );
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={type.title}>{restaurant.name}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{restaurant.foodType}</Text>
            </View>
            <Text style={[type.body, { marginTop: spacing.md }]}>
              {restaurant.description}
            </Text>
            {notice ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}
            <Text style={[type.heading, { marginTop: spacing.xl }]}>Menu</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Nothing on the menu yet"
            message="This restaurant has not added any meals so far."
          />
        }
        renderItem={({ item }) => {
          const line = cart.lines.find((l) => l.meal.id === item.id);
          return (
            <View style={styles.meal} testID={`meal-${item.name}`}>
              <View style={styles.mealText}>
                <Text style={type.subheading}>{item.name}</Text>
                <Text style={[type.muted, { marginTop: 2 }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>{formatPrice(item.price)}</Text>
              </View>
              <Pressable
                onPress={() => handleAdd(item)}
                testID={`add-${item.name}`}
                style={({ pressed }) => [styles.add, pressed ? { opacity: 0.85 } : null]}
              >
                <Text style={styles.addText}>{line ? `Add (${line.quantity})` : 'Add'}</Text>
              </Pressable>
            </View>
          );
        }}
      />

      {cart.itemCount > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartBarTitle}>
              {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.cartBarSub}>{cart.restaurant?.name}</Text>
          </View>
          <Button label={`View cart  ${formatPrice(cart.total)}`} onPress={onViewCart} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
  list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { marginBottom: spacing.md },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginTop: spacing.sm,
  },
  tagText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  notice: {
    marginTop: spacing.lg,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { color: colors.success, fontSize: 13 },
  meal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mealText: { flex: 1 },
  price: { ...type.subheading, color: colors.primaryDark, marginTop: spacing.sm },
  add: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  addText: { color: colors.primaryDark, fontWeight: '700', fontSize: 14 },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  cartBarTitle: { ...type.subheading },
  cartBarSub: { ...type.muted },
});
