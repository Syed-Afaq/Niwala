import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Order, OrderStatus } from '../api/types';
import { CheckGlyph, CrossGlyph } from './Glyphs';
import { formatDateTime, formatTime, isSameDay } from '../lib/format';
import { colors, radius, spacing, type } from '../theme/theme';

/** The status names used by the brief and shown throughout the app. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PROCESSING: 'Processing',
  IN_ROUTE: 'In Route',
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

const HAPPY_PATH: OrderStatus[] = ['PLACED', 'PROCESSING', 'IN_ROUTE', 'DELIVERED', 'RECEIVED'];

/**
 * Where the order is on its journey.
 *
 * Steps it has reached are ticked and show the time recorded in the order
 * history. Steps still ahead are hollow and carry no time, since none has
 * happened. Nothing is inferred: a time only appears if the server stored one.
 * A canceled order shows only the steps it actually went through.
 */
export function OrderProgress({ order }: { order: Pick<Order, 'status' | 'history' | 'createdAt'> }) {
  const reachedAt = new Map<OrderStatus, string>();
  for (const entry of order.history) reachedAt.set(entry.newStatus, entry.changedAt);

  const steps: OrderStatus[] =
    order.status === 'CANCELED' ? ['PLACED', 'CANCELED'] : HAPPY_PATH;

  return (
    <View testID="order-progress">
      {steps.map((step, index) => {
        const at = reachedAt.get(step);
        const done = Boolean(at);
        const isCurrent = step === order.status;
        const isLast = index === steps.length - 1;
        const nextDone = !isLast && reachedAt.has(steps[index + 1]);

        const markerColor =
          step === 'CANCELED' ? colors.error : step === 'RECEIVED' ? colors.success : colors.primary;

        // Show the date as well when a step happened on a later day than the order.
        const when = at
          ? isSameDay(at, order.createdAt)
            ? formatTime(at)
            : formatDateTime(at)
          : null;

        return (
          <View key={step} style={styles.step} testID={`progress-${step}-${done ? 'done' : 'pending'}`}>
            <View style={styles.rail}>
              {done ? (
                <View style={[styles.marker, { backgroundColor: markerColor, borderColor: markerColor }]}>
                  {step === 'CANCELED' ? (
                    <CrossGlyph color={colors.onPrimary} size={9} />
                  ) : (
                    <CheckGlyph color={colors.onPrimary} size={11} />
                  )}
                </View>
              ) : (
                <View style={styles.marker} />
              )}
              {!isLast ? (
                <View style={[styles.connector, nextDone ? { backgroundColor: markerColor } : null]} />
              ) : null}
            </View>

            <View style={[styles.stepText, isLast ? null : styles.stepGap]}>
              <Text
                style={[
                  styles.stepLabel,
                  !done ? styles.stepPending : null,
                  isCurrent ? { color: markerColor, fontWeight: '700' } : null,
                ]}
              >
                {STATUS_LABEL[step]}
              </Text>
              {when ? <Text style={type.meta}>{when}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const MARKER = 22;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
  step: { flexDirection: 'row' },
  rail: { width: MARKER, alignItems: 'center', marginRight: spacing.md },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: { flex: 1, width: 2, minHeight: 14, backgroundColor: colors.border },
  stepText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    minHeight: MARKER,
    paddingTop: 1,
  },
  stepGap: { paddingBottom: spacing.lg },
  stepLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepPending: { color: colors.textMuted, fontWeight: '500' },
});
