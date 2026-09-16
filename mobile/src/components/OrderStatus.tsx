import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { OrderStatus, OrderStatusHistory } from '../api/types';
import { colors, radius, spacing, type } from '../theme/theme';

/** Wording a customer understands, rather than the raw enum. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PROCESSING: 'Preparing',
  IN_ROUTE: 'On the way',
  DELIVERED: 'Delivered',
  RECEIVED: 'Received',
  CANCELED: 'Canceled',
};

const STATUS_TONE: Record<OrderStatus, { bg: string; fg: string }> = {
  PLACED: { bg: colors.warningSoft, fg: colors.warning },
  PROCESSING: { bg: colors.warningSoft, fg: colors.warning },
  IN_ROUTE: { bg: colors.primarySoft, fg: colors.primaryDark },
  DELIVERED: { bg: colors.primarySoft, fg: colors.primaryDark },
  RECEIVED: { bg: colors.successSoft, fg: colors.success },
  CANCELED: { bg: colors.errorSoft, fg: colors.error },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * The order's history, oldest first. Every recorded change is shown — nothing
 * is collapsed or overwritten, so the trail matches what the server stored.
 */
export function StatusTimeline({ history }: { history: OrderStatusHistory[] }) {
  if (history.length === 0) {
    return <Text style={type.muted}>No history yet.</Text>;
  }

  return (
    <View>
      {history.map((entry, index) => {
        const isLast = index === history.length - 1;
        // A cancelled order should not end on a cheerful orange dot.
        const currentColor =
          entry.newStatus === 'CANCELED'
            ? colors.error
            : entry.newStatus === 'RECEIVED'
              ? colors.success
              : colors.primary;
        return (
          <View key={entry.id} style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[styles.dot, isLast ? { backgroundColor: currentColor } : null]}
              />
              {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.stepBody}>
              <Text style={[type.subheading, isLast ? { color: currentColor } : null]}>
                {STATUS_LABEL[entry.newStatus]}
              </Text>
              <Text style={type.muted}>{formatTime(entry.changedAt)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  step: { flexDirection: 'row' },
  rail: { width: 24, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginTop: 5,
  },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  stepBody: { flex: 1, paddingBottom: spacing.lg },
});
