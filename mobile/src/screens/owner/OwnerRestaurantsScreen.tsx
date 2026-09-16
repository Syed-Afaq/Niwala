import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useHeaderlessTopPadding } from '../../hooks/useScreenInsets';
import { RestaurantCard } from '../../components/RestaurantCard';
import { RestaurantListSkeleton } from '../../components/Skeleton';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';

export function OwnerRestaurantsScreen({
  onOpenRestaurant,
  onCreateRestaurant,
}: {
  onOpenRestaurant: (id: string, name: string) => void;
  onCreateRestaurant: () => void;
}) {
  const query = useQuery({
    queryKey: ['my-restaurants'],
    queryFn: () => restaurantApi.mine().then((r) => r.restaurants),
  });
  const pull = usePullToRefresh(query.refetch);
  const topPadding = useHeaderlessTopPadding();

  if (query.isPending) {
    return (
      <View style={{ paddingTop: topPadding - spacing.xl }}>
        <RestaurantListSkeleton withSearch={false} />
      </View>
    );
  }

  if (query.isError && !query.data) {
    return (
      <ErrorState
        title="Could not load your restaurants"
        message={describeError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const restaurants = query.data ?? [];

  if (restaurants.length === 0) {
    return (
      <EmptyState
        title="Add your first restaurant"
        message="Give it a name, a cuisine and a cover photo, then build its menu so customers can order."
        action={<Button label="Add a restaurant" onPress={onCreateRestaurant} />}
      />
    );
  }

  return (
    <FlatList
      data={restaurants}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingTop: topPadding }]}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Your kitchen</Text>
            <Text style={type.title}>Restaurants</Text>
            <Text style={[type.meta, { marginTop: spacing.xs }]}>
              {restaurants.length} {restaurants.length === 1 ? 'restaurant' : 'restaurants'} on
              Niwala
            </Text>
          </View>
          <Pressable
            onPress={onCreateRestaurant}
            accessibilityRole="button"
            testID="add-restaurant"
            style={({ pressed }) => [styles.addButton, pressed ? styles.addPressed : null]}
          >
            <Text style={styles.addText}>+ New</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <RestaurantCard
          restaurant={item}
          onPress={() => onOpenRestaurant(item.id, item.name)}
          testID={`owner-restaurant-${item.name}`}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  headerText: { flexShrink: 1 },
  eyebrow: { fontSize: 13, fontWeight: '600', color: colors.primaryDark, marginBottom: spacing.xs },
  addButton: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addText: { color: colors.primaryDark, fontSize: 15, fontWeight: '700' },
});
