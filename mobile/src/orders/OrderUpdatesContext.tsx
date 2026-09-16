import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { orderApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import type { Order, OrderStatus } from '../api/types';

/** How often order data is refreshed while signed in. */
export const ORDER_POLL_MS = 5000;

/** Last status the person actually looked at, per order id. */
type SeenMap = Record<string, OrderStatus>;

type OrderUpdatesValue = {
  /** Orders that are new, or whose status changed since they were last opened. */
  unseenIds: Set<string>;
  unseenCount: number;
  /** Record that the person has now seen this order in its current state. */
  markSeen: (order: Pick<Order, 'id' | 'status'>) => void;
};

const OrderUpdatesContext = createContext<OrderUpdatesValue | null>(null);

const storageKey = (userId: string) => `niwala.seenOrders.${userId}`;

/**
 * Keeps the order list fresh for the whole signed-in session and works out
 * which orders have changed since the person last opened them.
 *
 * It lives above the tab navigator on purpose: the Orders tab badge has to
 * update even while that tab has never been opened.
 *
 * The first time an account is seen on this device, everything already there
 * counts as seen, so an existing order history does not arrive as a wall of
 * notifications.
 */
export function OrderUpdatesProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const userId = status === 'signedIn' ? user?.id ?? null : null;

  // null means not loaded yet; undefined means this device has no record.
  const [seen, setSeen] = useState<SeenMap | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;
    setSeen(null);
    if (!userId) return;

    AsyncStorage.getItem(storageKey(userId))
      .then((raw) => {
        if (!cancelled) setSeen(raw ? (JSON.parse(raw) as SeenMap) : undefined);
      })
      .catch(() => {
        if (!cancelled) setSeen(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list().then((r) => r.orders),
    enabled: Boolean(userId),
    refetchInterval: ORDER_POLL_MS,
  });

  const persist = useCallback(
    (next: SeenMap) => {
      if (userId) void AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
    },
    [userId]
  );

  // First sync for this account on this device: take the current state as seen.
  useEffect(() => {
    if (seen !== undefined || !orders.data) return;
    const baseline: SeenMap = {};
    for (const order of orders.data) baseline[order.id] = order.status;
    setSeen(baseline);
    persist(baseline);
  }, [seen, orders.data, persist]);

  const markSeen = useCallback(
    (order: Pick<Order, 'id' | 'status'>) => {
      setSeen((current) => {
        if (!current || current[order.id] === order.status) return current;
        const next = { ...current, [order.id]: order.status };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const unseenIds = useMemo(() => {
    const ids = new Set<string>();
    if (!seen || !orders.data) return ids;
    for (const order of orders.data) {
      if (seen[order.id] !== order.status) ids.add(order.id);
    }
    return ids;
  }, [seen, orders.data]);

  const value = useMemo(
    () => ({ unseenIds, unseenCount: unseenIds.size, markSeen }),
    [unseenIds, markSeen]
  );

  return (
    <OrderUpdatesContext.Provider value={value}>{children}</OrderUpdatesContext.Provider>
  );
}

export function useOrderUpdates(): OrderUpdatesValue {
  const context = useContext(OrderUpdatesContext);
  if (!context) {
    throw new Error('useOrderUpdates must be used inside an OrderUpdatesProvider');
  }
  return context;
}
