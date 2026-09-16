import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, currentUser } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { requireNotBlocked } from '../middleware/require-not-blocked';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schemas';
import { createOrderSchema } from '../schemas/order.schemas';
import { changeOrderStatusSchema } from '../schemas/order-status.schemas';
import * as orderService from '../services/order.service';

export const orderRouter = Router();

orderRouter.use(authenticate);

/** Both roles have an order list; the service decides what each one sees. */
orderRouter.get('/', async (req, res, next) => {
  try {
    res.json({ orders: await orderService.listFor(currentUser(req)) });
  } catch (err) {
    next(err);
  }
});

orderRouter.post(
  '/',
  authorize(Role.REGULAR_USER),
  requireNotBlocked,
  validateBody(createOrderSchema),
  async (req, res, next) => {
    try {
      const order = await orderService.create(currentUser(req).id, req.body);
      res.status(201).json({ order });
    } catch (err) {
      next(err);
    }
  }
);

orderRouter.get('/:id', validateParams(idParamSchema), async (req, res, next) => {
  try {
    res.json({ order: await orderService.getFor(req.params.id, currentUser(req)) });
  } catch (err) {
    next(err);
  }
});

/**
 * One endpoint for every status change. Which roles may do what is decided by
 * the transition table, not by having a separate route per action.
 */
orderRouter.patch(
  '/:id/status',
  validateParams(idParamSchema),
  validateBody(changeOrderStatusSchema),
  async (req, res, next) => {
    try {
      const order = await orderService.changeStatus(
        req.params.id,
        currentUser(req),
        req.body.status
      );
      res.json({ order });
    } catch (err) {
      next(err);
    }
  }
);
