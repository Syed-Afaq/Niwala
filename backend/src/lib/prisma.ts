import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client for the whole process.
 * All database access in the app goes through this instance.
 */
export const prisma = new PrismaClient();
