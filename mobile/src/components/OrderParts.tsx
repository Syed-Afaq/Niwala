import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { FoodImage } from './FoodImage';
import { StatusBadge } from './OrderStatus';
import { DOT, MULTIPLY, formatDateTime, orderReference } from '../lib/format';
import { colors, formatPrice, radius, spacing, type } from '../theme/theme';
import type { Order } from '../api/types';

/** Restaurant, order reference, placed time and current status. */
export function OrderHeader({ order }: { order: Order }) {
  return (
    <View style={styles.header}>
      <FoodImage
        path={order.restaurant.imageUrl}
        name={order.restaurant.name}
        toneKey={order.restaurant.foodType}
        style={styles.thumb}
        initialSize={24}
      />
      <View style={styles.headerText}>
        <Text style={styles.restaurant} numberOfLines={2}>
          {order.restaurant.name}
        </Text>
        <Text style={type.meta}>
          {orderReference(order.id)}
          {DOT}
          {formatDateTime(order.createdAt)}
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge status={order.status} />
        </View>
      </View>
    </View>
  );
}

/** A titled section on a white surface. */
export function Section({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** Line items priced at what was actually charged, and the stored total. */
export function OrderReceipt({ order }: { order: Order }) {
  return (
    <View>
      {order.items.map((item) => (
        <View key={item.id} style={styles.line}>
          <Text style={styles.qty}>
            {item.quantity}
            {MULTIPLY}
          </Text>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.meal.name}
          </Text>
          <Text style={styles.amount}>{formatPrice(Number(item.unitPrice) * item.quantity)}</Text>
        </View>
      ))}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue} testID="order-total">
          {formatPrice(order.totalAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  headerText: { flex: 1, minWidth: 0 },
  restaurant: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 2 },
  badgeRow: { marginTop: spacing.sm },
  section: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...type.label,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  line: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  qty: { width: 34, fontSize: 15, fontWeight: '600', color: colors.textMuted },
  itemName: { flex: 1, fontSize: 15, color: colors.text, paddingRight: spacing.sm },
  amount: { fontSize: 15, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.text },
});
