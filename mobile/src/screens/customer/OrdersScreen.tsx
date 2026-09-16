import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { StatusBadge } from '../../components/OrderStatus';
import { Button, EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';

export function OrdersScreen({
  onOpenOrder,
  onBrowse,
}: {
  onOpenOrder: (orderId: string) => void;
  onBrowse: () => void;
}) {
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list().then((r) => r.orders),
  });

  if (query.isPending) {
    return <Loading label="Loading your orders" />;
  }

  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
      </View>
    );
  }

  const orders = query.data ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="When you order something, you can follow it here from kitchen to doorstep."
        action={<Button label="Browse restaurants" onPress={onBrowse} />}
      />
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />
      }
      ListHeaderComponent={
        <Text style={[type.title, { marginBottom: spacing.lg }]}>Your orders</Text>
      }
      renderItem={({ item }) => {
        const itemLabel = item.items.length === 1 ? 'item' : 'items';
        const placed = new Date(item.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        return (
          <Pressable
            onPress={() => onOpenOrder(item.id)}
            testID={`order-${item.id}`}
            style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
          >
            <View style={styles.cardTop}>
              <Text style={type.subheading}>{item.restaurant.name}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={[type.muted, { marginTop: spacing.xs }]}>
              {item.items.length} {itemLabel} - {placed}
            </Text>
            <Text style={styles.total}>{formatPrice(item.totalAmount)}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  padded: { padding: spacing.lg },
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
  total: { ...type.subheading, color: colors.primaryDark, marginTop: spacing.sm },
});
