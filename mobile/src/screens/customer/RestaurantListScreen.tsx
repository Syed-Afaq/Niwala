import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { RestaurantCard } from '../../components/RestaurantCard';
import { SearchBar } from '../../components/SearchBar';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, spacing, type } from '../../theme/theme';
import type { Restaurant } from '../../api/types';

/** Case-insensitive match on the restaurant name or its cuisine. */
function matches(restaurant: Restaurant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    restaurant.name.toLowerCase().includes(q) ||
    restaurant.foodType.toLowerCase().includes(q)
  );
}

export function RestaurantListScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (restaurant: Restaurant) => void;
}) {
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantApi.list().then((r) => r.restaurants),
  });
  const pull = usePullToRefresh(query.refetch);

  const all = query.data ?? [];
  // The list is small and already loaded, so search runs on the device.
  const visible = useMemo(() => all.filter((r) => matches(r, search)), [all, search]);
  const isSearching = search.trim().length > 0;

  if (query.isPending) {
    return <Loading label="Finding restaurants" />;
  }

  if (query.isError && !query.data) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
        <Button label="Try again" variant="secondary" onPress={() => void query.refetch()} />
      </View>
    );
  }

  const subtitle = isSearching
    ? `${visible.length} of ${all.length} ${all.length === 1 ? 'restaurant' : 'restaurants'}`
    : `${all.length} ${all.length === 1 ? 'place' : 'places'} to order from`;

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
      // Kept as a stable element so the search field does not lose focus while
      // the results underneath it change.
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Good food, delivered</Text>
          <Text style={type.title}>Restaurants</Text>
          <Text style={[type.meta, styles.subtitle]}>{subtitle}</Text>
          <View style={styles.search}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or cuisine"
              testID="restaurant-search"
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        isSearching ? (
          <View style={styles.empty}>
            <EmptyState
              title={`No restaurants match "${search.trim()}"`}
              message="Try a different name, or search by cuisine such as Italian or Mexican."
              action={
                <Button label="Clear search" variant="secondary" onPress={() => setSearch('')} />
              }
            />
          </View>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              title="No restaurants yet"
              message="Once a restaurant joins Niwala it will show up here."
            />
          </View>
        )
      }
      renderItem={({ item }) => (
        <RestaurantCard
          restaurant={item}
          onPress={() => onOpenRestaurant(item)}
          testID={`restaurant-${item.name}`}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  padded: { padding: spacing.lg, gap: spacing.md },
  header: { marginBottom: spacing.xl },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  subtitle: { marginTop: spacing.xs },
  search: { marginTop: spacing.lg },
  empty: { paddingTop: spacing.xl },
});
