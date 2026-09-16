import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import { signToken } from '../lib/jwt';
import { LoginInput, RegisterInput } from '../schemas/auth.schemas';

const BCRYPT_ROUNDS = 10;

/** Fields safe to return to a client — never includes passwordHash. */
const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  isBlocked: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, role: input.role },
      select: publicUserSelect,
    });

    return { user, token: signToken({ sub: user.id, role: user.role }) };
  } catch (err) {
    // Unique violation on email. Relying on the database constraint rather than
    // a prior lookup keeps two simultaneous registrations from both succeeding.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'An account with that email already exists');
    }
    throw err;
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Unknown email and wrong password return the same error so the API does not
  // reveal which addresses have accounts.
  const invalid = new HttpError(401, 'Invalid email or password');
  if (!user) {
    throw invalid;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw invalid;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
    token: signToken({ sub: user.id, role: user.role }),
  };
}
