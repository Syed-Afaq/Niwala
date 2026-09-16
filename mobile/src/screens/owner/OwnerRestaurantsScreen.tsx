import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { restaurantApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
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

  if (query.isPending) {
    return <Loading label="Loading your restaurants" />;
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
        message="Add your first restaurant to start taking orders on Niwala."
        action={<Button label="Add a restaurant" onPress={onCreateRestaurant} />}
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
          <Text style={type.title}>Your restaurants</Text>
          <Button
            label="Add a restaurant"
            onPress={onCreateRestaurant}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpenRestaurant(item.id, item.name)}
          testID={`owner-restaurant-${item.name}`}
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
  header: { marginBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: { borderColor: colors.primary },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
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
