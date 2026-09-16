import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { ORDER_POLL_MS, useOrderUpdates } from '../../orders/OrderUpdatesContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { confirmAction } from '../../lib/confirm';
import { OrderProgress } from '../../components/OrderStatus';
import { OrderHeader, OrderReceipt, Section } from '../../components/OrderParts';
import { OrderDetailSkeleton } from '../../components/Skeleton';
import { Button, ErrorBanner, ErrorState } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
import type { OrderStatus } from '../../api/types';

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const { markSeen } = useOrderUpdates();

  // Poll only while this screen is in front of the person. Stacks keep screens
  // mounted in the background, and those should not keep fetching.
  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.get(orderId).then((r) => r.order),
    refetchInterval: isFocused ? ORDER_POLL_MS : false,
  });
  const pull = usePullToRefresh(query.refetch);

  // Looking at the order is what clears its badge.
  useEffect(() => {
    if (isFocused && query.data) markSeen(query.data);
  }, [isFocused, query.data, markSeen]);

  const changeStatus = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.setStatus(orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => setActionError(describeError(err)),
  });

  if (query.isPending) {
    return <OrderDetailSkeleton />;
  }

  // A failed background refresh keeps the order on screen rather than blanking it.
  if (query.isError && !query.data) {
    return (
      <ErrorState
        title="Could not load this order"
        message={describeError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const order = query.data;

  // Only actions this customer may take right now. The server enforces the same
  // rules; this just avoids offering buttons that would be refused.
  const canCancel = order.status === 'PLACED';
  const canReceive = order.status === 'DELIVERED';
  const isFinished = order.status === 'RECEIVED' || order.status === 'CANCELED';

  function receive() {
    setActionError(null);
    changeStatus.mutate('RECEIVED');
  }

  function cancel() {
    setActionError(null);
    confirmAction({
      title: 'Cancel this order?',
      message: `${order.restaurant.name} has not started preparing it yet. This cannot be undone.`,
      confirmLabel: 'Cancel order',
      onConfirm: () => changeStatus.mutate('CANCELED'),
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
    >
      <OrderHeader order={order} />

      {canReceive ? (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>Your order has arrived</Text>
          <Text style={styles.calloutText}>
            Let {order.restaurant.name} know once it is in your hands.
          </Text>
        </View>
      ) : null}

      <ErrorBanner message={actionError} />

      <Section title="Order progress">
        <OrderProgress order={order} />
      </Section>

      <Section title="Your order">
        <OrderReceipt order={order} />
      </Section>

      {canReceive ? (
        <Button
          label="I have received my order"
          onPress={receive}
          loading={changeStatus.isPending}
          style={styles.primaryAction}
          testID="receive-order"
        />
      ) : null}

      {canCancel ? (
        <Button
          label="Cancel order"
          variant="danger"
          onPress={cancel}
          loading={changeStatus.isPending}
          style={styles.primaryAction}
          testID="cancel-order"
        />
      ) : null}

      {!canCancel && !canReceive ? (
        <Text style={[type.muted, styles.footnote]}>
          {isFinished
            ? 'This order is complete.'
            : 'The restaurant will update this as your order moves along.'}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  callout: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.successSoft,
  },
  calloutTitle: { fontSize: 16, fontWeight: '700', color: colors.success },
  calloutText: { ...type.body, color: colors.text, marginTop: 2 },
  primaryAction: { marginTop: spacing.xl },
  footnote: { marginTop: spacing.xl, textAlign: 'center' },
});
