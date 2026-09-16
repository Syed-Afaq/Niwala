import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FoodImage } from './FoodImage';
import { STATUS_LABEL, StatusBadge } from './OrderStatus';
import { DOT, MULTIPLY, formatDateTime } from '../lib/format';
import { colors, formatPrice, radius, shadow, spacing, type } from '../theme/theme';
import type { Order } from '../api/types';

/**
 * One order in a list, laid out like a receipt stub: where it is from, when,
 * what was in it, what it cost, and where it stands. Owners also see who
 * placed it.
 */
export function OrderCard({
  order,
  showCustomer = false,
  unseen = false,
  onPress,
}: {
  order: Order;
  showCustomer?: boolean;
  unseen?: boolean;
  onPress: () => void;
}) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const summary = order.items
    .map((item) => `${item.quantity}${MULTIPLY} ${item.meal.name}`)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order from ${order.restaurant.name}, ${STATUS_LABEL[order.status]}`}
      testID={`order-${order.id}`}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <FoodImage
        path={order.restaurant.imageUrl}
        name={order.restaurant.name}
        toneKey={order.restaurant.foodType}
        style={styles.thumb}
        initialSize={22}
      />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            {unseen ? <View style={styles.unseenDot} /> : null}
            <Text style={styles.title} numberOfLines={1}>
              {order.restaurant.name}
            </Text>
          </View>
          <StatusBadge status={order.status} />
        </View>

        <Text style={type.meta} numberOfLines={1}>
          {formatDateTime(order.createdAt)}
          {DOT}
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>

        {showCustomer ? (
          <Text style={[type.meta, styles.customer]} numberOfLines={1}>
            {order.user.email}
          </Text>
        ) : null}

        <Text style={styles.summary} numberOfLines={1}>
          {summary}
        </Text>

        <View style={styles.bottomRow}>
          {unseen ? (
            <Text style={styles.unseenText}>{showCustomer ? 'Needs your attention' : 'Updated'}</Text>
          ) : (
            <View />
          )}
          <Text style={styles.total}>{formatPrice(order.totalAmount)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  pressed: { borderColor: colors.primary, transform: [{ scale: 0.99 }] },
  thumb: { width: 60, height: 60, borderRadius: radius.md },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 2,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text, flexShrink: 1 },
  unseenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  customer: { color: colors.text, marginTop: 2 },
  summary: { ...type.muted, marginTop: spacing.xs },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  unseenText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  total: { fontSize: 16, fontWeight: '700', color: colors.text },
});
