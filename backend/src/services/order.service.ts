import { Prisma, OrderStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { CreateOrderInput } from '../schemas/order.schemas';
import { AuthenticatedUser } from '../types/express';
import { findTransition, nextStatusesFrom } from '../lib/order-transitions';

/** Shape returned for a single order: everything the app needs to render it. */
const orderInclude = {
  restaurant: { select: { id: true, name: true, foodType: true } },
  // isBlocked included so an owner viewing an order can see, and toggle,
  // the customer's block state without a second request.
  user: { select: { id: true, email: true, isBlocked: true } },
  items: {
    include: { meal: { select: { id: true, name: true, description: true } } },
  },
  history: { orderBy: { changedAt: 'asc' } },
} satisfies Prisma.OrderInclude;

/**
 * Creates an order from meal ids and quantities.
 *
 * Nothing about money or ownership comes from the client. The client sends
 * which meals and how many; prices, the restaurant, and the total are all read
 * from the database. A client-supplied price or total is ignored entirely,
 * because the schema does not accept those fields in the first place.
 */
export async function create(userId: string, input: CreateOrderInput) {
  const requestedIds = input.items.map((item) => item.mealId);

  const duplicates = requestedIds.filter((id, i) => requestedIds.indexOf(id) !== i);
  if (duplicates.length > 0) {
    throw new HttpError(
      400,
      'Each meal may appear only once in an order — combine them using quantity'
    );
  }

  const meals = await prisma.meal.findMany({ where: { id: { in: requestedIds } } });

  if (meals.length !== requestedIds.length) {
    const found = new Set(meals.map((meal) => meal.id));
    throw new HttpError(400, 'Some meals do not exist', {
      unknownMealIds: requestedIds.filter((id) => !found.has(id)),
    });
  }

  // An order belongs to exactly one restaurant.
  const restaurantIds = [...new Set(meals.map((meal) => meal.restaurantId))];
  if (restaurantIds.length > 1) {
    throw new HttpError(400, 'An order can only contain meals from one restaurant', {
      restaurantIds,
    });
  }

  const priceByMealId = new Map(meals.map((meal) => [meal.id, meal.price]));

  // Total is summed from stored prices using Decimal, never floating point.
  const total = input.items.reduce(
    (sum, item) => sum.add(priceByMealId.get(item.mealId)!.mul(item.quantity)),
    new Prisma.Decimal(0)
  );

  return prisma.order.create({
    data: {
      userId,
      restaurantId: restaurantIds[0],
      totalAmount: total,
      status: OrderStatus.PLACED,
      items: {
        create: input.items.map((item) => ({
          mealId: item.mealId,
          quantity: item.quantity,
          // Snapshot, so a later price change does not rewrite this order.
          unitPrice: priceByMealId.get(item.mealId)!,
        })),
      },
      history: {
        create: {
          previousStatus: null,
          newStatus: OrderStatus.PLACED,
          changedById: userId,
        },
      },
    },
    include: orderInclude,
  });
}

/**
 * Orders the caller is allowed to see: a regular user sees their own, an owner
 * sees the orders placed with restaurants they own.
 */
export async function listFor(user: AuthenticatedUser) {
  const where =
    user.role === Role.REGULAR_USER
      ? { userId: user.id }
      : { restaurant: { ownerId: user.id } };

  return prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * A single order, readable by the user who placed it or the owner of the
 * restaurant it was placed with. Anyone else gets 404 rather than 403: an
 * unrelated order is not theirs to know about.
 */
export async function getFor(id: string, user: AuthenticatedUser) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { ...orderInclude, restaurant: { select: { id: true, name: true, foodType: true, ownerId: true } } },
  });

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  const isPlacedByUser = order.userId === user.id;
  const isForOwnedRestaurant = order.restaurant.ownerId === user.id;

  if (!isPlacedByUser && !isForOwnedRestaurant) {
    throw new HttpError(404, 'Order not found');
  }

  return order;
}

/**
 * Moves an order to a new status.
 *
 * Four things must hold, and each has its own answer:
 *   - the caller may see the order at all              -> 404
 *   - the change is a legal transition                 -> 409
 *   - the caller's role is the one allowed to make it  -> 403
 *   - the caller is the right *person* of that role    -> 403
 *
 * The final write is a compare-and-set on the status the check was based on,
 * so two requests racing to advance the same order cannot both succeed.
 */
export async function changeStatus(
  id: string,
  user: AuthenticatedUser,
  nextStatus: OrderStatus
) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!order) {
    throw new HttpError(404, 'Order not found');
  }

  const isPlacedByUser = order.userId === user.id;
  const ownsRestaurant = order.restaurant.ownerId === user.id;

  if (!isPlacedByUser && !ownsRestaurant) {
    throw new HttpError(404, 'Order not found');
  }

  if (order.status === nextStatus) {
    throw new HttpError(409, `This order is already ${nextStatus}`);
  }

  const transition = findTransition(order.status, nextStatus);

  if (!transition) {
    const allowed = nextStatusesFrom(order.status);
    throw new HttpError(
      409,
      allowed.length === 0
        ? `This order is ${order.status} and can no longer change`
        : `An order cannot go from ${order.status} to ${nextStatus}`,
      { currentStatus: order.status, allowedNextStatuses: allowed }
    );
  }

  if (user.role !== transition.role) {
    throw new HttpError(
      403,
      transition.role === Role.RESTAURANT_OWNER
        ? 'Only the restaurant can make this change'
        : 'Only the customer who placed this order can make this change'
    );
  }

  // Right role, but it must also be the right person.
  if (transition.role === Role.REGULAR_USER && !isPlacedByUser) {
    throw new HttpError(403, 'Only the customer who placed this order can make this change');
  }
  if (transition.role === Role.RESTAURANT_OWNER && !ownsRestaurant) {
    throw new HttpError(403, 'Only the restaurant can make this change');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: nextStatus },
    });

    // Someone else advanced this order between the check and the write.
    if (updated.count !== 1) {
      throw new HttpError(409, 'This order was changed by someone else — reload and try again');
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: id,
        previousStatus: order.status,
        newStatus: nextStatus,
        changedById: user.id,
      },
    });

    return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
  });
}
