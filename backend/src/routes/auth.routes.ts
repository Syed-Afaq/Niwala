import { Router } from 'express';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { loginSchema, registerSchema } from '../schemas/auth.schemas';
import * as authService from '../services/auth.service';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    res.status(201).json(await authService.register(req.body));
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    res.status(200).json(await authService.login(req.body));
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});
