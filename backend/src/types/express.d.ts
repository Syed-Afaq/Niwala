import { Role } from '@prisma/client';

/** The authenticated caller, attached by the `authenticate` middleware. */
export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  isBlocked: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
