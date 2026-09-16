import React from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { useOrderUpdates } from '../../orders/OrderUpdatesContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useHeaderlessTopPadding } from '../../hooks/useScreenInsets';
import { OrderCard } from '../../components/OrderCard';
import { OrderListSkeleton } from '../../components/Skeleton';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { colors, spacing, type } from '../../theme/theme';
import type { Order } from '../../api/types';

const isFinished = (order: Order) => order.status === 'RECEIVED' || order.status === 'CANCELED';

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
  const { unseenIds } = useOrderUpdates();
  const pull = usePullToRefresh(query.refetch);
  const topPadding = useHeaderlessTopPadding();

  if (query.isPending) {
    return (
      <View style={{ paddingTop: topPadding - spacing.xl }}>
        <OrderListSkeleton />
      </View>
    );
  }

  if (query.isError && !query.data) {
    return (
      <ErrorState
        title="Could not load your orders"
        message={describeError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const orders = query.data ?? [];

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        message="When you order something, you can follow it here from the kitchen to your door."
        action={<Button label="Browse restaurants" onPress={onBrowse} />}
      />
    );
  }

  const active = orders.filter((o) => !isFinished(o));
  const past = orders.filter(isFinished);
  const sections = [
    ...(active.length ? [{ title: 'In progress', data: active }] : []),
    ...(past.length ? [{ title: 'Past orders', data: past }] : []),
  ];

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingTop: topPadding }]}
      stickySectionHeadersEnabled={false}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={type.title}>Your orders</Text>
          <Text style={[type.meta, { marginTop: spacing.xs }]}>
            {active.length > 0
              ? `${active.length} in progress`
              : 'Nothing in progress right now'}
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <OrderCard order={item} unseen={unseenIds.has(item.id)} onPress={() => onOpenOrder(item.id)} />
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
  header: { marginBottom: spacing.md },
  sectionTitle: {
    ...type.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
