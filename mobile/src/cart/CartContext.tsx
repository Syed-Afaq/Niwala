import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Meal, Restaurant } from '../api/types';

export type CartLine = { meal: Meal; quantity: number };

type CartContextValue = {
  /** The restaurant every line belongs to, or null when the cart is empty. */
  restaurant: Pick<Restaurant, 'id' | 'name'> | null;
  lines: CartLine[];
  itemCount: number;
  total: number;
  /** True when this meal comes from a different restaurant than the cart. */
  conflictsWith: (restaurantId: string) => boolean;
  add: (restaurant: Pick<Restaurant, 'id' | 'name'>, meal: Meal) => void;
  setQuantity: (mealId: string, quantity: number) => void;
  remove: (mealId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * A cart holds meals from exactly one restaurant, mirroring the rule the API
 * enforces. Adding from a different restaurant is refused here rather than
 * failing at checkout, so the conflict surfaces where the person can act on it.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [restaurant, setRestaurant] = useState<Pick<Restaurant, 'id' | 'name'> | null>(
    null
  );
  const [lines, setLines] = useState<CartLine[]>([]);

  const clear = useCallback(() => {
    setRestaurant(null);
    setLines([]);
  }, []);

  const conflictsWith = useCallback(
    (restaurantId: string) =>
      restaurant !== null && lines.length > 0 && restaurant.id !== restaurantId,
    [restaurant, lines.length]
  );

  const add = useCallback(
    (nextRestaurant: Pick<Restaurant, 'id' | 'name'>, meal: Meal) => {
      setRestaurant((current) =>
        current && current.id === nextRestaurant.id ? current : nextRestaurant
      );
      setLines((current) => {
        const fromAnotherRestaurant =
          current.length > 0 && current[0].meal.restaurantId !== meal.restaurantId;
        const base = fromAnotherRestaurant ? [] : current;
        const existing = base.find((line) => line.meal.id === meal.id);
        if (existing) {
          return base.map((line) =>
            line.meal.id === meal.id ? { ...line, quantity: line.quantity + 1 } : line
          );
        }
        return [...base, { meal, quantity: 1 }];
      });
    },
    []
  );

  const setQuantity = useCallback((mealId: string, quantity: number) => {
    setLines((current) => {
      const next =
        quantity <= 0
          ? current.filter((line) => line.meal.id !== mealId)
          : current.map((line) =>
              line.meal.id === mealId ? { ...line, quantity } : line
            );
      return next;
    });
  }, []);

  const remove = useCallback(
    (mealId: string) => setQuantity(mealId, 0),
    [setQuantity]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines]
  );

  // Shown only as a preview. The server recomputes the real total.
  const total = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.meal.price) * line.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      restaurant: lines.length > 0 ? restaurant : null,
      lines,
      itemCount,
      total,
      conflictsWith,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [restaurant, lines, itemCount, total, conflictsWith, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
}
