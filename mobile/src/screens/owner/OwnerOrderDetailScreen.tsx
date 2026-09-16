import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi, userApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { ORDER_POLL_MS, useOrderUpdates } from '../../orders/OrderUpdatesContext';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { confirmAction } from '../../lib/confirm';
import { OrderProgress, STATUS_LABEL } from '../../components/OrderStatus';
import { OrderHeader, OrderReceipt, Section } from '../../components/OrderParts';
import { OrderDetailSkeleton } from '../../components/Skeleton';
import { Button, ErrorBanner, ErrorState } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/theme';
import type { OrderStatus } from '../../api/types';

/**
 * The single step this restaurant can take next, mirroring the server
 * transition table. Statuses the restaurant does not control return null.
 */
function nextStepFor(status: OrderStatus): { label: string; status: OrderStatus } | null {
  switch (status) {
    case 'PLACED':
      return { label: 'Start processing', status: 'PROCESSING' };
    case 'PROCESSING':
      return { label: 'Mark as in route', status: 'IN_ROUTE' };
    case 'IN_ROUTE':
      return { label: 'Mark as delivered', status: 'DELIVERED' };
    default:
      return null;
  }
}

export function OwnerOrderDetailScreen({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const { markSeen } = useOrderUpdates();

  // Poll only while this screen is in front of the person.
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

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const advance = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.setStatus(orderId, status),
    onSuccess: invalidate,
    onError: (err) => setActionError(describeError(err)),
  });

  const setBlocked = useMutation({
    mutationFn: ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) =>
      userApi.setBlocked(userId, isBlocked),
    onSuccess: invalidate,
    onError: (err) => setActionError(describeError(err)),
  });

  if (query.isPending) {
    return <OrderDetailSkeleton />;
  }

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
  const nextStep = nextStepFor(order.status);
  const isFinished = order.status === 'RECEIVED' || order.status === 'CANCELED';

  function toggleBlock() {
    setActionError(null);
    const customer = order.user;
    if (customer.isBlocked) {
      setBlocked.mutate({ userId: customer.id, isBlocked: false });
      return;
    }
    confirmAction({
      title: 'Block this customer?',
      message:
        customer.email +
        ' will not be able to place new orders. Existing orders are not affected, and you can unblock them at any time.',
      confirmLabel: 'Block customer',
      onConfirm: () => setBlocked.mutate({ userId: customer.id, isBlocked: true }),
    });
  }

  const finishedText =
    order.status === 'CANCELED'
      ? 'The customer canceled this order.'
      : 'Complete. The customer confirmed they received it.';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} />}
    >
      <OrderHeader order={order} />

      <ErrorBanner message={actionError} />

      <View style={styles.nextStep}>
        {nextStep ? (
          <View>
            <Text style={styles.nextLabel}>NEXT STEP</Text>
            <Text style={styles.nextText}>
              Currently {STATUS_LABEL[order.status]}. Move it on when it is ready.
            </Text>
            <Button
              label={nextStep.label}
              onPress={() => {
                setActionError(null);
                advance.mutate(nextStep.status);
              }}
              loading={advance.isPending}
              style={{ marginTop: spacing.md }}
              testID="advance-order"
            />
          </View>
        ) : (
          <Text style={styles.nextText}>
            {isFinished
              ? finishedText
              : 'Delivered. Waiting for the customer to confirm they received it.'}
          </Text>
        )}
      </View>

      <Section title="Order progress">
        <OrderProgress order={order} />
      </Section>

      <Section title="Items">
        <OrderReceipt order={order} />
      </Section>

      <Section title="Customer">
        <View style={styles.customerRow}>
          <Text style={[type.subheading, styles.email]} numberOfLines={1} testID="order-customer">
            {order.user.email}
          </Text>
          {order.user.isBlocked ? (
            <View style={styles.blockedTag}>
              <Text style={styles.blockedTagText}>Blocked</Text>
            </View>
          ) : null}
        </View>
        <Text style={[type.muted, { marginTop: spacing.xs }]}>
          {order.user.isBlocked
            ? 'Blocked customers keep their existing orders but cannot place new ones.'
            : 'Block a customer to stop them placing new orders.'}
        </Text>
        <Button
          label={order.user.isBlocked ? 'Unblock customer' : 'Block customer'}
          variant={order.user.isBlocked ? 'secondary' : 'danger'}
          onPress={toggleBlock}
          loading={setBlocked.isPending}
          style={{ marginTop: spacing.md }}
          testID="toggle-block"
        />
      </Section>
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
  nextStep: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  nextText: { ...type.body, color: colors.text },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  email: { flexShrink: 1 },
  blockedTag: {
    backgroundColor: colors.errorSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  blockedTagText: { color: colors.error, fontSize: 12, fontWeight: '700' },
});
