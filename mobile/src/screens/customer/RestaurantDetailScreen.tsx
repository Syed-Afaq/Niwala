import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { useCart } from '../../cart/CartContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { FoodImage } from '../../components/FoodImage';
import { MealCard } from '../../components/MealCard';
import { CartSummaryBar } from '../../components/CartSummaryBar';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
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
  const pull = usePullToRefresh(query.refetch);

  if (query.isPending) {
    return <Loading label="Loading menu" />;
  }

  if (query.isError && !query.data) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
        <Button label="Try again" variant="secondary" onPress={() => void query.refetch()} />
      </View>
    );
  }

  const restaurant = query.data;
  const meals = restaurant.meals ?? [];

  function handleAdd(meal: Meal) {
    const replacing = cart.conflictsWith(restaurant.id);
    cart.add({ id: restaurant.id, name: restaurant.name }, meal);
    // Only speak up when something surprising happened; a normal add is
    // already confirmed by the button and the cart bar.
    setNotice(
      replacing
        ? 'Your cart can hold one restaurant at a time, so it now only has dishes from here.'
        : null
    );
  }

  const cartIsElsewhere = cart.restaurant !== null && cart.restaurant.id !== restaurant.id;

  return (
    <View style={styles.screen}>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
        ListHeaderComponent={
          <View>
            <FoodImage
              path={restaurant.imageUrl}
              name={restaurant.name}
              toneKey={restaurant.foodType}
              style={styles.cover}
              initialSize={72}
            />

            <View style={styles.info}>
              <Text style={styles.cuisine}>{restaurant.foodType}</Text>
              <Text style={type.title}>{restaurant.name}</Text>
              <Text style={styles.description}>{restaurant.description}</Text>

              {notice ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{notice}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.menuHeader}>
              <Text style={type.heading}>Menu</Text>
              <Text style={type.meta}>
                {meals.length} {meals.length === 1 ? 'dish' : 'dishes'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.side}>
            <EmptyState
              title="Nothing on the menu yet"
              message="This restaurant has not added any dishes so far. Check back soon."
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.side}>
            <MealCard
              meal={item}
              toneKey={restaurant.foodType}
              quantityInCart={cart.lines.find((l) => l.meal.id === item.id)?.quantity ?? 0}
              onAdd={() => handleAdd(item)}
              testID={`meal-${item.name}`}
            />
          </View>
        )}
      />

      <CartSummaryBar
        itemCount={cart.itemCount}
        total={cart.total}
        restaurantName={cartIsElsewhere ? cart.restaurant?.name : undefined}
        onViewCart={onViewCart}
      />
    </View>
  );
}

const MAX_WIDTH = 640;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  padded: { padding: spacing.lg, gap: spacing.md },
  list: { paddingBottom: spacing.xxl, maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  info: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  cuisine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.sm },
  notice: {
    marginTop: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { fontSize: 14, color: colors.primaryDark, lineHeight: 20 },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  side: { paddingHorizontal: spacing.lg },
});
