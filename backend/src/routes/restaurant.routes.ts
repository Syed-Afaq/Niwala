import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, currentUser } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schemas';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from '../schemas/restaurant.schemas';
import * as restaurantService from '../services/restaurant.service';
import { restaurantMealRouter } from './meal.routes';

export const restaurantRouter = Router();

// Browsing and managing restaurants both require a signed-in caller.
restaurantRouter.use(authenticate);

// Declared before '/:id', otherwise ':id' would swallow the literal "mine".
restaurantRouter.get('/mine', authorize(Role.RESTAURANT_OWNER), async (req, res, next) => {
  try {
    const restaurants = await restaurantService.listOwnedBy(currentUser(req).id);
    res.json({ restaurants });
  } catch (err) {
    next(err);
  }
});

restaurantRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ restaurants: await restaurantService.listAll() });
  } catch (err) {
    next(err);
  }
});

restaurantRouter.post(
  '/',
  authorize(Role.RESTAURANT_OWNER),
  validateBody(createRestaurantSchema),
  async (req, res, next) => {
    try {
      const restaurant = await restaurantService.create(currentUser(req).id, req.body);
      res.status(201).json({ restaurant });
    } catch (err) {
      next(err);
    }
  }
);

restaurantRouter.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    res.json({ restaurant: await restaurantService.getById(req.params.id) });
  } catch (err) {
    next(err);
  }
});

restaurantRouter.patch(
  '/:id',
  authorize(Role.RESTAURANT_OWNER),
  validateParams(idParamSchema),
  validateBody(updateRestaurantSchema),
  async (req, res, next) => {
    try {
      const restaurant = await restaurantService.update(
        req.params.id,
        currentUser(req).id,
        req.body
      );
      res.json({ restaurant });
    } catch (err) {
      next(err);
    }
  }
);

restaurantRouter.delete(
  '/:id',
  authorize(Role.RESTAURANT_OWNER),
  validateParams(idParamSchema),
  async (req, res, next) => {
    try {
      await restaurantService.remove(req.params.id, currentUser(req).id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// Menu of a specific restaurant.
restaurantRouter.use('/:restaurantId/meals', restaurantMealRouter);
