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
import { EmptyState, ErrorState } from '../../components/ui';
import { colors, spacing, type } from '../../theme/theme';
import type { Order } from '../../api/types';

/** Orders the restaurant still has to act on. Delivered ones wait on the customer. */
const needsRestaurant = (o: Order) =>
  o.status === 'PLACED' || o.status === 'PROCESSING' || o.status === 'IN_ROUTE';
const isFinished = (o: Order) => o.status === 'RECEIVED' || o.status === 'CANCELED';

export function OwnerOrdersScreen({ onOpenOrder }: { onOpenOrder: (orderId: string) => void }) {
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
        title="Could not load orders"
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
        message="Orders placed with your restaurants will show up here, newest first."
      />
    );
  }

  const toDo = orders.filter(needsRestaurant);
  const waiting = orders.filter((o) => o.status === 'DELIVERED');
  const done = orders.filter(isFinished);
  const sections = [
    ...(toDo.length ? [{ title: 'Needs your action', data: toDo }] : []),
    ...(waiting.length ? [{ title: 'Waiting for the customer', data: waiting }] : []),
    ...(done.length ? [{ title: 'Completed', data: done }] : []),
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
          <Text style={type.title}>Orders</Text>
          <Text style={[type.meta, { marginTop: spacing.xs }]}>
            {toDo.length > 0
              ? `${toDo.length} ${toDo.length === 1 ? 'needs' : 'need'} your action`
              : 'You are all caught up'}
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={styles.sectionTitle}>{section.title}</Text>}
      renderItem={({ item }) => (
        <OrderCard
          order={item}
          showCustomer
          unseen={unseenIds.has(item.id)}
          onPress={() => onOpenOrder(item.id)}
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
