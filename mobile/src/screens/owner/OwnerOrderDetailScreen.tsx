import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi, userApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { StatusBadge, StatusTimeline } from '../../components/OrderStatus';
import { Button, Card, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';
import type { OrderStatus } from '../../api/types';

/**
 * The single step this restaurant can take next, mirroring the server's
 * transition table. Statuses the restaurant does not control return null.
 */
function nextStepFor(status: OrderStatus): { label: string; status: OrderStatus } | null {
  switch (status) {
    case 'PLACED':
      return { label: 'Start preparing', status: 'PROCESSING' };
    case 'PROCESSING':
      return { label: 'Mark as on the way', status: 'IN_ROUTE' };
    case 'IN_ROUTE':
      return { label: 'Mark as delivered', status: 'DELIVERED' };
    default:
      return null;
  }
}

export function OwnerOrderDetailScreen({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.get(orderId).then((r) => r.order),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const advance = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.setStatus(orderId, status),
    onSuccess: invalidate,
    onError: (err) => setError(describeError(err)),
  });

  const setBlocked = useMutation({
    mutationFn: ({ userId, isBlocked }: { userId: string; isBlocked: boolean }) =>
      userApi.setBlocked(userId, isBlocked),
    onSuccess: invalidate,
    onError: (err) => setError(describeError(err)),
  });

  if (query.isPending) {
    return <Loading label="Loading order" />;
  }

  if (query.isError) {
    return (
      <View style={styles.padded}>
        <ErrorBanner message={describeError(query.error)} />
      </View>
    );
  }

  const order = query.data;
  const nextStep = nextStepFor(order.status);
  const isFinished = order.status === 'RECEIVED' || order.status === 'CANCELED';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={type.title}>{order.restaurant.name}</Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        <StatusBadge status={order.status} />
      </View>

      <ErrorBanner message={error} />

      <Card>
        <Text style={type.label}>CUSTOMER</Text>
        <Text style={[type.subheading, { marginTop: spacing.xs }]} testID="order-customer">
          {order.user.email}
        </Text>
        {order.user.isBlocked ? (
          <View style={styles.blockedTag}>
            <Text style={styles.blockedTagText}>Blocked</Text>
          </View>
        ) : null}

        <Button
          label={order.user.isBlocked ? 'Unblock customer' : 'Block customer'}
          variant={order.user.isBlocked ? 'secondary' : 'danger'}
          loading={setBlocked.isPending}
          onPress={() => {
            setError(null);
            setBlocked.mutate({ userId: order.user.id, isBlocked: !order.user.isBlocked });
          }}
          style={{ marginTop: spacing.lg }}
        />
        <Text style={[type.muted, { marginTop: spacing.sm }]}>
          A blocked customer keeps their existing orders but cannot place new ones.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[type.label, { marginBottom: spacing.md }]}>ITEMS</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={type.body}>
              {item.quantity} x {item.meal.name}
            </Text>
            <Text style={type.body}>
              {formatPrice(Number(item.unitPrice) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={type.subheading}>Total</Text>
          <Text style={[type.subheading, { color: colors.primaryDark }]}>
            {formatPrice(order.totalAmount)}
          </Text>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[type.label, { marginBottom: spacing.md }]}>PROGRESS</Text>
        <StatusTimeline history={order.history} />
      </Card>

      {nextStep ? (
        <Button
          label={nextStep.label}
          onPress={() => {
            setError(null);
            advance.mutate(nextStep.status);
          }}
          loading={advance.isPending}
          style={{ marginTop: spacing.xl }}
          testID="advance-order"
        />
      ) : (
        <Text style={[type.muted, styles.footnote]}>
          {isFinished
            ? 'This order is complete.'
            : 'Delivered. Waiting for the customer to confirm they received it.'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: spacing.xxl,
  },
  padded: { padding: spacing.lg },
  item: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  blockedTag: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.errorSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  blockedTagText: { color: colors.error, fontSize: 12, fontWeight: '700' },
  footnote: { marginTop: spacing.xl, textAlign: 'center' },
});
