import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/endpoints';
import { describeError } from '../../api/client';
import { useCart } from '../../cart/CartContext';
import { useAuth } from '../../auth/AuthContext';
import { Button, Card, EmptyState, ErrorBanner } from '../../components/ui';
import { colors, formatPrice, radius, spacing, type } from '../../theme/theme';

export function CartScreen({
  onBrowse,
  onOrderPlaced,
}: {
  onBrowse: () => void;
  onOrderPlaced: (orderId: string) => void;
}) {
  const cart = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: () =>
      orderApi.create(
        cart.lines.map((line) => ({ mealId: line.meal.id, quantity: line.quantity }))
      ),
    onSuccess: ({ order }) => {
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={type.title}>Your order</Text>
      <Text style={[type.muted, { marginBottom: spacing.lg }]}>
        From {cart.restaurant?.name}
      </Text>

      <ErrorBanner message={error} />

      {user?.isBlocked ? (
        <View style={styles.blocked}>
          <Text style={styles.blockedText}>
            Your account has been blocked, so new orders cannot be placed.
          </Text>
        </View>
      ) : null}

      <Card>
        {cart.lines.map((line, index) => (
          <View
            key={line.meal.id}
            style={[styles.line, index > 0 ? styles.lineDivider : null]}
          >
            <View style={styles.lineText}>
              <Text style={type.subheading}>{line.meal.name}</Text>
              <Text style={type.muted}>{formatPrice(line.meal.price)} each</Text>
            </View>

            <View style={styles.stepper}>
              <Pressable
                onPress={() => cart.setQuantity(line.meal.id, line.quantity - 1)}
                style={styles.stepperButton}
                testID={`decrease-${line.meal.name}`}
              >
                <Text style={styles.stepperLabel}>-</Text>
              </Pressable>
              <Text style={styles.quantity} testID={`qty-${line.meal.name}`}>
                {line.quantity}
              </Text>
              <Pressable
                onPress={() => cart.setQuantity(line.meal.id, line.quantity + 1)}
                style={styles.stepperButton}
                testID={`increase-${line.meal.name}`}
              >
                <Text style={styles.stepperLabel}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.lineTotal}>
              {formatPrice(Number(line.meal.price) * line.quantity)}
            </Text>
          </View>
        ))}
      </Card>

      <View style={styles.totalRow}>
        <Text style={type.heading}>Total</Text>
        <Text style={[type.heading, { color: colors.primaryDark }]} testID="cart-total">
          {formatPrice(cart.total)}
        </Text>
      </View>
      <Text style={type.muted}>
        The restaurant confirms the final amount when your order is placed.
      </Text>

      <Button
        label="Place order"
        onPress={() => {
          setError(null);
          placeOrder.mutate();
        }}
        loading={placeOrder.isPending}
        disabled={user?.isBlocked}
        style={{ marginTop: spacing.xl }}
      />
      <Button
        label="Clear cart"
        variant="secondary"
        onPress={cart.clear}
        style={{ marginTop: spacing.md }}
      />
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
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  lineDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  lineText: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  stepperLabel: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 20 },
  quantity: { minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  lineTotal: { minWidth: 64, textAlign: 'right', fontSize: 15, fontWeight: '700' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  blocked: {
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  blockedText: { color: colors.error, fontSize: 14 },
});
