import { Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  isBlocked: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Blocks or unblocks a customer.
 *
 * The schema the spec prescribes keeps a single blocked flag on the user, so a
 * block is app-wide rather than per-restaurant: any owner may set it, and it
 * applies everywhere. Making it per-restaurant would need a join table the
 * spec explicitly rules out.
 *
 * Only customers can be blocked — owners cannot block each other, which also
 * makes blocking yourself impossible.
 */
export async function setBlocked(targetUserId: string, isBlocked: boolean) {
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!target) {
    throw new HttpError(404, 'User not found');
  }

  if (target.role !== Role.REGULAR_USER) {
    throw new HttpError(403, 'Only customers can be blocked');
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { isBlocked },
    select: publicUserSelect,
  });
}

/**
 * Customers who have ordered from this owner's restaurants — the people an
 * owner has any reason to block.
 */
export async function listCustomersOf(ownerId: string) {
  return prisma.user.findMany({
    where: {
      role: Role.REGULAR_USER,
      orders: { some: { restaurant: { ownerId } } },
    },
    select: publicUserSelect,
    orderBy: { email: 'asc' },
  });
}
