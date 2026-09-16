import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { ACTIVE_ORDER_STATUSES } from '../lib/order-status';
import {
  CreateRestaurantInput,
  UpdateRestaurantInput,
} from '../schemas/restaurant.schemas';

/**
 * Loads a restaurant and confirms the caller owns it.
 *
 * This is the single ownership gate for restaurants: every write path goes
 * through it, so changing an id in a request cannot reach another owner's data.
 *
 * A restaurant that exists but belongs to someone else returns 403 rather than
 * 404. Every restaurant is already visible through `GET /restaurants`, so
 * hiding existence here would buy nothing and make the error less useful.
 */
export async function assertOwnedBy(restaurantId: string, ownerId: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });

  if (!restaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  if (restaurant.ownerId !== ownerId) {
    throw new HttpError(403, 'You do not own this restaurant');
  }

  return restaurant;
}

/** Every restaurant, for regular users browsing the app. */
export async function listAll() {
  return prisma.restaurant.findMany({ orderBy: { name: 'asc' } });
}

/** Only the restaurants belonging to this owner. */
export async function listOwnedBy(ownerId: string) {
  return prisma.restaurant.findMany({ where: { ownerId }, orderBy: { name: 'asc' } });
}

/** Details plus the menu, so the app can render a restaurant in one request. */
export async function getById(id: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { meals: { orderBy: { name: 'asc' } } },
  });

  if (!restaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  return restaurant;
}

export async function create(ownerId: string, input: CreateRestaurantInput) {
  return prisma.restaurant.create({ data: { ...input, ownerId } });
}

export async function update(id: string, ownerId: string, input: UpdateRestaurantInput) {
  await assertOwnedBy(id, ownerId);
  return prisma.restaurant.update({ where: { id }, data: input });
}

/**
 * Deleting a restaurant cascades to its meals and orders, so it is refused
 * while any order is still in flight — a customer waiting on food must not
 * have that order disappear because the owner removed the restaurant.
 *
 * Orders the user already received, and canceled ones, do not block deletion.
 *
 * The check and the delete share a transaction so an order placed at the same
 * moment cannot slip past the check.
 */
export async function remove(id: string, ownerId: string) {
  await assertOwnedBy(id, ownerId);

  await prisma.$transaction(async (tx) => {
    const activeOrders = await tx.order.count({
      where: { restaurantId: id, status: { in: [...ACTIVE_ORDER_STATUSES] } },
    });

    if (activeOrders > 0) {
      throw new HttpError(
        409,
        `This restaurant has ${activeOrders} order(s) still in progress. ` +
          'Complete or cancel them before deleting it.'
      );
    }

    // Every remaining order is finished, so remove them before the restaurant.
    // This cannot be left to the cascade: deleting a restaurant would remove
    // its meals in the same statement, and the database refuses to delete a
    // meal while an OrderItem still references it. Clearing the orders first
    // takes those references away. (Postgres checks Restrict immediately, and
    // NoAction behaves the same way unless the constraint is deferrable.)
    await tx.order.deleteMany({ where: { restaurantId: id } });
    await tx.restaurant.delete({ where: { id } });
  });
}
