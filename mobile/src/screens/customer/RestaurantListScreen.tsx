import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
import type { Restaurant } from '../../api/types';

export function RestaurantListScreen({
  onOpenRestaurant,
}: {
  onOpenRestaurant: (restaurant: Restaurant) => void;
}) {
  const query = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantApi.list().then((r) => r.restaurants),
  });

  if (query.isPending) {
    return <Loading label="Finding restaurants" />;
  }

  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
      </View>
    );
  }

  const restaurants = query.data ?? [];

  if (restaurants.length === 0) {
    return (
      <EmptyState
        title="No restaurants yet"
        message="Once a restaurant joins Niwala it will show up here."
      />
    );
  }

  return (
    <FlatList
      data={restaurants}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={type.title}>Restaurants</Text>
          <Text style={type.muted}>
            {restaurants.length} place{restaurants.length === 1 ? '' : 's'} to order from
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpenRestaurant(item)}
          testID={`restaurant-${item.name}`}
          style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        >
          <View style={styles.cardTop}>
            <Text style={[type.heading, styles.cardTitle]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.foodType}</Text>
            </View>
          </View>
          <Text style={[type.muted, { marginTop: spacing.xs }]} numberOfLines={2}>
            {item.description}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  padded: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: { borderColor: colors.primary, opacity: 0.95 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Without this the title pushes the tag off the edge on narrow screens.
  cardTitle: { flexShrink: 1, flexGrow: 1 },
  tag: {
    flexShrink: 0,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tagText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
});
