import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { StatusBadge, StatusTimeline } from '../../components/OrderStatus';
import { Button, Card, ErrorBanner, Loading } from '../../components/ui';
import { colors, formatPrice, spacing, type } from '../../theme/theme';
import type { OrderStatus } from '../../api/types';

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.get(orderId).then((r) => r.order),
  });

  const changeStatus = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.setStatus(orderId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
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

  // Only the actions this customer may perform right now. The server checks
  // the same thing again; this just avoids offering dead buttons.
  const canCancel = order.status === 'PLACED';
  const canReceive = order.status === 'DELIVERED';
  const isFinished = order.status === 'RECEIVED' || order.status === 'CANCELED';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={type.title}>{order.restaurant.name}</Text>
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
        <StatusBadge status={order.status} />
      </View>

      <ErrorBanner message={error} />

      <Card>
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
          <Text
            style={[type.subheading, { color: colors.primaryDark }]}
            testID="order-total"
          >
            {formatPrice(order.totalAmount)}
          </Text>
        </View>
      </Card>

      <Card style={{ marginTop: spacing.lg }}>
        <Text style={[type.label, { marginBottom: spacing.md }]}>PROGRESS</Text>
        <StatusTimeline history={order.history} />
      </Card>

      {canCancel ? (
        <Button
          label="Cancel order"
          variant="danger"
          onPress={() => {
            setError(null);
            changeStatus.mutate('CANCELED');
          }}
          loading={changeStatus.isPending}
          style={{ marginTop: spacing.xl }}
        />
      ) : null}

      {canReceive ? (
        <Button
          label="I have received this order"
          onPress={() => {
            setError(null);
            changeStatus.mutate('RECEIVED');
          }}
          loading={changeStatus.isPending}
          style={{ marginTop: spacing.xl }}
        />
      ) : null}

      {!canCancel && !canReceive ? (
        <Text style={[type.muted, styles.footnote]}>
          {isFinished
            ? 'This order is complete.'
            : 'Waiting on the restaurant for the next update.'}
        </Text>
      ) : null}
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
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footnote: { marginTop: spacing.xl, textAlign: 'center' },
});
