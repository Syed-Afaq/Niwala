import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { prisma } from './lib/prisma';
import { authRouter } from './routes/auth.routes';
import { restaurantRouter } from './routes/restaurant.routes';
import { mealRouter } from './routes/meal.routes';
import { orderRouter } from './routes/order.routes';
import { userRouter } from './routes/user.routes';
import { uploadRouter } from './routes/upload.routes';
import { ensureUploadsDir, UPLOADS_DIR, UPLOADS_ROUTE } from './lib/uploads';
import { errorHandler, notFound } from './middleware/error-handler';

ensureUploadsDir();

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
app.use('/orders', orderRouter);
app.use('/users', userRouter);

// Uploaded images: served as static files, stored via the upload route.
app.use(
  UPLOADS_ROUTE,
  express.static(UPLOADS_DIR, {
    fallthrough: true,
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  })
);
app.use(UPLOADS_ROUTE, uploadRouter);

// Must stay last: unmatched routes, then the single error handler.
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
