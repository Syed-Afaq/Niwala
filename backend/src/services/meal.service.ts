import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { CreateMealInput, UpdateMealInput } from '../schemas/meal.schemas';
import * as restaurantService from './restaurant.service';

/**
 * Loads a meal and confirms the caller owns the restaurant it belongs to.
 * Meals have no owner of their own — ownership is always inherited from the
 * parent restaurant.
 */
async function assertOwnedBy(mealId: string, ownerId: string) {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    include: { restaurant: { select: { ownerId: true } } },
  });

  if (!meal) {
    throw new HttpError(404, 'Meal not found');
  }

  if (meal.restaurant.ownerId !== ownerId) {
    throw new HttpError(403, 'You do not own the restaurant this meal belongs to');
  }

  return meal;
}

export async function listForRestaurant(restaurantId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });

  if (!restaurant) {
    throw new HttpError(404, 'Restaurant not found');
  }

  return prisma.meal.findMany({ where: { restaurantId }, orderBy: { name: 'asc' } });
}

export async function getById(id: string) {
  const meal = await prisma.meal.findUnique({ where: { id } });

  if (!meal) {
    throw new HttpError(404, 'Meal not found');
  }

  return meal;
}

export async function create(
  restaurantId: string,
  ownerId: string,
  input: CreateMealInput
) {
  await restaurantService.assertOwnedBy(restaurantId, ownerId);
  return prisma.meal.create({ data: { ...input, restaurantId } });
}

export async function update(id: string, ownerId: string, input: UpdateMealInput) {
  await assertOwnedBy(id, ownerId);
  return prisma.meal.update({ where: { id }, data: input });
}

export async function remove(id: string, ownerId: string) {
  await assertOwnedBy(id, ownerId);

  try {
    await prisma.meal.delete({ where: { id } });
  } catch (err) {
    // OrderItem.mealId is onDelete: Restrict, so a meal that appears on an
    // order cannot be removed without rewriting order history.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new HttpError(
        409,
        'This meal appears on existing orders and cannot be deleted'
      );
    }
    throw err;
  }
}
