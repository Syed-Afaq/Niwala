import { OrderStatus } from '@prisma/client';

/**
 * An order is finished once the user has received it or it was canceled.
 * Nothing can happen to it afterwards.
 */
export const TERMINAL_ORDER_STATUSES = [
  OrderStatus.RECEIVED,
  OrderStatus.CANCELED,
] as const;

/**
 * Everything else is still in flight — the user is waiting on it. DELIVERED
 * counts as active: the restaurant says it arrived, but the user has not
 * confirmed yet.
 */
export const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PLACED,
  OrderStatus.PROCESSING,
  OrderStatus.IN_ROUTE,
  OrderStatus.DELIVERED,
] as const;
