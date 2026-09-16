import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { useCart } from '../../cart/CartContext';
import { useAuth } from '../../auth/AuthContext';
import { useOrderUpdates } from '../../orders/OrderUpdatesContext';
import { confirmAction } from '../../lib/confirm';
import { FoodImage } from '../../components/FoodImage';
import { Button, EmptyState, ErrorBanner } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';

/** Minus and plus as 40px targets with a small visible face. */
function StepButton({
  label,
  onPress,
  accessibilityLabel,
  testID,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={styles.stepTarget}
    >
      {({ pressed }) => (
        <View style={[styles.stepFace, pressed ? styles.stepFacePressed : null]}>
          <Text style={styles.stepLabel}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function CartScreen({
  onBrowse,
  onOrderPlaced,
}: {
  onBrowse: () => void;
  onOrderPlaced: (orderId: string) => void;
}) {
  const cart = useCart();
  const { user } = useAuth();
  const { markSeen } = useOrderUpdates();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: () =>
      orderApi.create(
        cart.lines.map((line) => ({ mealId: line.meal.id, quantity: line.quantity }))
      ),
    onSuccess: ({ order }) => {
      // Your own new order is not news to you.
      markSeen(order);
      cart.clear();
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOrderPlaced(order.id);
    },
    onError: (err) => setError(describeError(err)),
  });

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Add a few dishes from a restaurant and they will show up here."
        action={<Button label="Browse restaurants" onPress={onBrowse} />}
      />
    );
  }

  const blocked = Boolean(user?.isBlocked);

  const clearCart = () =>
    confirmAction({
      title: 'Clear your cart?',
      message: 'Every dish will be removed.',
      confirmLabel: 'Clear cart',
      onConfirm: cart.clear,
    });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.title}>Your order</Text>
        <Text style={[type.meta, { marginTop: spacing.xs }]}>From {cart.restaurant?.name}</Text>

        <View style={{ marginTop: spacing.lg }}>
          <ErrorBanner message={error} />
        </View>

        {blocked ? (
          <View style={styles.blocked}>
            <Text style={styles.blockedTitle}>Ordering is unavailable</Text>
            <Text style={styles.blockedText}>
              Your account has been blocked, so new orders cannot be placed.
            </Text>
          </View>
        ) : null}

        <View style={styles.lines}>
          {cart.lines.map((line, index) => (
            <View
              key={line.meal.id}
              style={[styles.line, index > 0 ? styles.lineDivider : null]}
              testID={'cart-line-' + line.meal.name}
            >
              <FoodImage
                path={line.meal.imageUrl}
                name={line.meal.name}
                toneKey={line.meal.name}
                style={styles.thumb}
                initialSize={20}
              />
              <View style={styles.lineText}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {line.meal.name}
                </Text>
                <Text style={type.meta}>{formatPrice(line.meal.price)} each</Text>
                <View style={styles.stepper}>
                  <StepButton
                    label="-"
                    accessibilityLabel={'Remove one ' + line.meal.name}
                    onPress={() => cart.setQuantity(line.meal.id, line.quantity - 1)}
                    testID={'decrease-' + line.meal.name}
                  />
                  <Text style={styles.quantity} testID={'qty-' + line.meal.name}>
                    {line.quantity}
                  </Text>
                  <StepButton
                    label="+"
                    accessibilityLabel={'Add one more ' + line.meal.name}
                    onPress={() => cart.setQuantity(line.meal.id, line.quantity + 1)}
                    testID={'increase-' + line.meal.name}
                  />
                </View>
              </View>
              <Text style={styles.lineTotal}>
                {formatPrice(Number(line.meal.price) * line.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={type.body}>
              {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={type.body}>{formatPrice(cart.total)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue} testID="cart-total">
              {formatPrice(cart.total)}
            </Text>
          </View>
          <Text style={[type.muted, { marginTop: spacing.sm }]}>
            The final amount is confirmed from current menu prices when you place the order.
          </Text>
        </View>

        <Pressable onPress={clearCart} style={styles.clear} accessibilityRole="button">
          <Text style={styles.clearText}>Clear cart</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={'Place order  ' + formatPrice(cart.total)}
          onPress={() => {
            setError(null);
            placeOrder.mutate();
          }}
          loading={placeOrder.isPending}
          disabled={blocked}
          testID="place-order"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  blocked: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  blockedTitle: { fontSize: 16, fontWeight: '700', color: colors.error },
  blockedText: { ...type.body, color: colors.error, marginTop: 2 },
  lines: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  line: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  lineDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  lineText: { flex: 1, minWidth: 0 },
  lineName: { fontSize: 16, fontWeight: '600', color: colors.text },
  lineTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, marginLeft: -8 },
  stepTarget: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepFace: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepFacePressed: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  stepLabel: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 20 },
  quantity: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  summary: { marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalRow: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 18, fontWeight: '600', color: colors.text },
  totalValue: { fontSize: 22, fontWeight: '700', color: colors.text },
  clear: { alignSelf: 'center', marginTop: spacing.xl, minHeight: 40, justifyContent: 'center' },
  clearText: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
