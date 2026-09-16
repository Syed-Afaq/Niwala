import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, currentUser } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody, validateParams } from '../middleware/validate';
import { idParamSchema } from '../schemas/common.schemas';
import { setBlockedSchema } from '../schemas/user.schemas';
import * as userService from '../services/user.service';

export const userRouter = Router();

userRouter.use(authenticate, authorize(Role.RESTAURANT_OWNER));

/** Customers who have ordered from this owner, so the app has someone to act on. */
userRouter.get('/customers', async (req, res, next) => {
  try {
    res.json({ customers: await userService.listCustomersOf(currentUser(req).id) });
  } catch (err) {
    next(err);
  }
});

userRouter.patch(
  '/:id/blocked',
  validateParams(idParamSchema),
  validateBody(setBlockedSchema),
  async (req, res, next) => {
    try {
      const user = await userService.setBlocked(req.params.id, req.body.isBlocked);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);
