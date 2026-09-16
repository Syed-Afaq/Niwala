import React, { useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealApi, restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';
import type { Meal } from '../../api/types';

/** Alert is a no-op on web, so fall back to confirm() there. */
function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

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
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => restaurantApi.get(restaurantId).then((r) => r.restaurant),
  });

  const deleteRestaurant = useMutation({
    mutationFn: () => restaurantApi.remove(restaurantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      onDeleted();
    },
    onError: (err) => setError(describeError(err)),
  });

  const deleteMeal = useMutation({
    mutationFn: (mealId: string) => mealApi.remove(mealId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
    },
    onError: (err) => setError(describeError(err)),
  });

  if (query.isPending) {
    return <Loading label="Loading restaurant" />;
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

  return (
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

          <ErrorBanner message={error} />

          <View style={styles.actions}>
            <Button
              label="Edit details"
              variant="secondary"
              onPress={onEditRestaurant}
              style={{ flex: 1 }}
            />
            <Button
              label="Delete"
              variant="danger"
              loading={deleteRestaurant.isPending}
              onPress={() => {
                setError(null);
                confirmAction(
                  'Delete this restaurant?',
                  'Its menu will be removed too. This cannot be undone.',
                  () => deleteRestaurant.mutate()
                );
              }}
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.menuHeader}>
            <Text style={type.heading}>Menu</Text>
            <Pressable onPress={onAddMeal} testID="add-meal">
              <Text style={styles.addLink}>Add meal</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          title="No meals yet"
          message="Add the first dish so customers have something to order."
          action={<Button label="Add meal" onPress={onAddMeal} />}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.meal} testID={`owner-meal-${item.name}`}>
          <View style={styles.mealText}>
            <Text style={type.subheading}>{item.name}</Text>
            <Text style={[type.muted, { marginTop: 2 }]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
          </View>
          <View style={styles.mealActions}>
            <Pressable onPress={() => onEditMeal(item)} testID={`edit-meal-${item.name}`}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setError(null);
                confirmAction('Delete this meal?', `${item.name} will be removed.`, () =>
                  deleteMeal.mutate(item.id)
                );
              }}
              testID={`delete-meal-${item.name}`}
            >
              <Text style={styles.deleteLink}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  padded: { padding: spacing.lg },
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
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  addLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
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
  mealActions: { gap: spacing.md, alignItems: 'flex-end' },
  editLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  deleteLink: { color: colors.error, fontWeight: '700', fontSize: 14 },
});
