import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
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

export async function remove(id: string, ownerId: string) {
  await assertOwnedBy(id, ownerId);
  await prisma.restaurant.delete({ where: { id } });
}
