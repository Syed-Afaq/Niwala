import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealApi, restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { confirmAction, showMessage } from '../../lib/confirm';
import { FoodImage } from '../../components/FoodImage';
import { MealCard } from '../../components/MealCard';
import { MenuSkeleton } from '../../components/Skeleton';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
import type { Meal } from '../../api/types';

export function OwnerRestaurantDetailScreen({
  restaurantId,
  onEditRestaurant,
  onAddMeal,
  onEditMeal,
  onDeleted,
}: {
  restaurantId: string;
  onEditRestaurant: () => void;
  onAddMeal: () => void;
  onEditMeal: (meal: Meal) => void;
  onDeleted: () => void;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantApi.get(restaurantId).then((r) => r.restaurant),
  });
  const pull = usePullToRefresh(query.refetch);

  // Failures are shown as a dialog rather than a banner at the top of the page,
  // which would be out of view when deleting a dish further down the menu.
  const deleteRestaurant = useMutation({
    mutationFn: () => restaurantApi.remove(restaurantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      onDeleted();
    },
    onError: (err) => showMessage('Could not delete restaurant', describeError(err)),
  });

  const deleteMeal = useMutation({
    mutationFn: (mealId: string) => mealApi.remove(mealId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
    },
    onError: (err) => showMessage('Could not delete dish', describeError(err)),
  });

  if (query.isPending) {
    return <MenuSkeleton />;
  }

  if (query.isError && !query.data) {
    return (
      <ErrorState
        title="Could not load this restaurant"
        message={describeError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const restaurant = query.data;
  const meals = restaurant.meals ?? [];

  const askDeleteRestaurant = () =>
    confirmAction({
      title: 'Delete ' + restaurant.name + '?',
      message:
        'Its menu is removed too. Restaurants with orders still in progress cannot be deleted.',
      confirmLabel: 'Delete restaurant',
      onConfirm: () => deleteRestaurant.mutate(),
    });

  const askDeleteMeal = (meal: Meal) =>
    confirmAction({
      title: 'Delete ' + meal.name + '?',
      message:
        'It will be removed from the menu. Dishes that appear on past orders cannot be deleted.',
      confirmLabel: 'Delete dish',
      onConfirm: () => deleteMeal.mutate(meal.id),
    });

  const renderMealActions = (item: Meal) => (
    <View style={styles.mealActions}>
      <Pressable
        onPress={() => onEditMeal(item)}
        hitSlop={8}
        style={styles.linkTarget}
        testID={'edit-meal-' + item.name}
      >
        <Text style={styles.editLink}>Edit</Text>
      </Pressable>
      <Pressable
        onPress={() => askDeleteMeal(item)}
        hitSlop={8}
        style={styles.linkTarget}
        testID={'delete-meal-' + item.name}
      >
        <Text style={styles.deleteLink}>Delete</Text>
      </Pressable>
    </View>
  );

  return (
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

            <View style={styles.actions}>
              <Button
                label="Edit details"
                variant="secondary"
                onPress={onEditRestaurant}
                style={styles.actionButton}
                testID="edit-restaurant"
              />
              <Button
                label="Delete"
                variant="danger"
                onPress={askDeleteRestaurant}
                loading={deleteRestaurant.isPending}
                style={styles.actionButton}
                testID="delete-restaurant"
              />
            </View>
          </View>

          <View style={styles.menuHeader}>
            <View>
              <Text style={type.heading}>Menu</Text>
              <Text style={type.meta}>
                {meals.length} {meals.length === 1 ? 'dish' : 'dishes'}
              </Text>
            </View>
            <Pressable
              onPress={onAddMeal}
              accessibilityRole="button"
              testID="add-meal"
              style={({ pressed }) => [styles.addDish, pressed ? styles.addDishPressed : null]}
            >
              <Text style={styles.addDishText}>+ Add dish</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.side}>
          <EmptyState
            title="No dishes yet"
            message="Add the first dish, with a photo, so customers have something to order."
            action={<Button label="Add dish" onPress={onAddMeal} />}
          />
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.side}>
          <MealCard
            meal={item}
            toneKey={restaurant.foodType}
            testID={'owner-meal-' + item.name}
            actions={renderMealActions(item)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  cover: { width: '100%', aspectRatio: 16 / 9 },
  info: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  cuisine: { fontSize: 13, fontWeight: '600', color: colors.primaryDark, marginBottom: spacing.xs },
  description: { ...type.body, color: colors.textMuted, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  actionButton: { flex: 1 },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addDish: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
  },
  addDishPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addDishText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700' },
  side: { paddingHorizontal: spacing.lg },
  mealActions: { flexDirection: 'row', gap: spacing.sm },
  linkTarget: { minHeight: 40, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  editLink: { color: colors.primaryDark, fontWeight: '700', fontSize: 15 },
  deleteLink: { color: colors.error, fontWeight: '700', fontSize: 15 },
});
