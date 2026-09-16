import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { prisma } from './lib/prisma';
import { authRouter } from './routes/auth.routes';
import { restaurantRouter } from './routes/restaurant.routes';
import { mealRouter } from './routes/meal.routes';
import { errorHandler, notFound } from './middleware/error-handler';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable' });
  }
});

app.use('/auth', authRouter);
app.use('/restaurants', restaurantRouter);
app.use('/meals', mealRouter);

// Must stay last: unmatched routes, then the single error handler.
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
