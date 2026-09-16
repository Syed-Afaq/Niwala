import { OrderStatus, Role } from '@prisma/client';

/**
 * The complete set of legal status changes. Anything not listed here is
 * rejected, which makes the flow forward-only by construction: there is no
 * transition back into PLACED, and none at all out of RECEIVED or CANCELED.
 *
 *   PLACED ─> PROCESSING ─> IN_ROUTE ─> DELIVERED ─> RECEIVED
 *      └────> CANCELED
 *
 * `role` is the only role permitted to perform that change. Which *person* of
 * that role may act is an ownership question, handled in the service.
 */
export type OrderTransition = {
  from: OrderStatus;
  to: OrderStatus;
  role: Role;
};

export const ORDER_TRANSITIONS: OrderTransition[] = [
  { from: OrderStatus.PLACED, to: OrderStatus.PROCESSING, role: Role.RESTAURANT_OWNER },
  { from: OrderStatus.PLACED, to: OrderStatus.CANCELED, role: Role.REGULAR_USER },
  { from: OrderStatus.PROCESSING, to: OrderStatus.IN_ROUTE, role: Role.RESTAURANT_OWNER },
  { from: OrderStatus.IN_ROUTE, to: OrderStatus.DELIVERED, role: Role.RESTAURANT_OWNER },
  { from: OrderStatus.DELIVERED, to: OrderStatus.RECEIVED, role: Role.REGULAR_USER },
];

export function findTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_TRANSITIONS.find((t) => t.from === from && t.to === to);
}

/** Used to explain a rejected change, rather than returning a bare error. */
export function nextStatusesFrom(from: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS.filter((t) => t.from === from).map((t) => t.to);
}
