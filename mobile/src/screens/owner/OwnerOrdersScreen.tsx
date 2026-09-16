import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { useOrderUpdates } from '../../orders/OrderUpdatesContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { describeError } from '../../api/client';
import { StatusBadge } from '../../components/OrderStatus';
import { EmptyState, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';

export function OwnerOrdersScreen({
  onOpenOrder,
}: {
  onOpenOrder: (orderId: string) => void;
}) {
  const query = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list().then((r) => r.orders),
  });
  const { unseenIds } = useOrderUpdates();
  const pull = usePullToRefresh(query.refetch);

  if (query.isPending) {
    return <Loading label="Loading orders" />;
  }

  if (query.isError && !query.data) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
      </View>
    );
  }

  const orders = query.data ?? [];
  const active = orders.filter(
    (o) => o.status !== 'RECEIVED' && o.status !== 'CANCELED'
  ).length;

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="Orders placed with your restaurants will appear here."
      />
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={type.title}>Orders</Text>
          <Text style={type.muted}>
            {active} still in progress out of {orders.length}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onOpenOrder(item.id)}
          testID={`owner-order-${item.id}`}
          style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
        >
          <View style={styles.cardTop}>
            <View style={styles.titleRow}>
              {unseenIds.has(item.id) ? <View style={styles.unseenDot} /> : null}
              <Text style={[type.subheading, styles.cardTitle]} numberOfLines={1}>
                {item.restaurant.name}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <Text style={[type.muted, { marginTop: spacing.xs }]} numberOfLines={1}>
            {item.user.email}
          </Text>
          <Text style={styles.total}>{formatPrice(item.totalAmount)}</Text>
          {unseenIds.has(item.id) ? <Text style={styles.unseenText}>Needs your attention</Text> : null}
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
  cardPressed: { borderColor: colors.primary },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { flexShrink: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1, flexGrow: 1 },
  unseenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  unseenText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', marginTop: spacing.xs },
  total: { ...type.subheading, color: colors.primaryDark, marginTop: spacing.sm },
});
