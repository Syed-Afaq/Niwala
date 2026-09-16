import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, currentUser } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema, restaurantIdParamSchema } from '../schemas/common.schemas';
import { createMealSchema, updateMealSchema } from '../schemas/meal.schemas';
import * as mealService from '../services/meal.service';

/**
 * Mounted at /restaurants/:restaurantId/meals.
 * `mergeParams` is what makes :restaurantId visible here.
 * Authentication is applied by the parent restaurant router.
 */
export const restaurantMealRouter = Router({ mergeParams: true });

restaurantMealRouter.get(
  '/',
  validateParams(restaurantIdParamSchema),
  async (req, res, next) => {
    try {
      const meals = await mealService.listForRestaurant(req.params.restaurantId);
      res.json({ meals });
    } catch (err) {
      next(err);
    }
  }
);

restaurantMealRouter.post(
  '/',
  authorize(Role.RESTAURANT_OWNER),
  validateParams(restaurantIdParamSchema),
  validateBody(createMealSchema),
  async (req, res, next) => {
    try {
      const meal = await mealService.create(
        req.params.restaurantId,
        currentUser(req).id,
        req.body
      );
      res.status(201).json({ meal });
    } catch (err) {
      next(err);
    }
  }
);

/** Mounted at /meals — operations on a meal by its own id. */
export const mealRouter = Router();

mealRouter.use(authenticate);

mealRouter.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    res.json({ meal: await mealService.getById(req.params.id) });
  } catch (err) {
    next(err);
  }
});

mealRouter.patch(
  '/:id',
  authorize(Role.RESTAURANT_OWNER),
  validateParams(idParamSchema),
  validateBody(updateMealSchema),
  async (req, res, next) => {
    try {
      const meal = await mealService.update(req.params.id, currentUser(req).id, req.body);
      res.json({ meal });
    } catch (err) {
      next(err);
    }
  }
);

mealRouter.delete(
  '/:id',
  authorize(Role.RESTAURANT_OWNER),
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await mealService.remove(req.params.id, currentUser(req).id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);
