import 'server-only';
import { Prisma } from '@/generated/prisma/client';
import { getDatabase } from '@/server/db/client';
import { normalizeUsername, registerSchema } from '@/modules/auth/validation';
import { dummyPasswordHash, hashPassword, verifyPassword } from './password';
import { allowsDevelopmentAccounts } from './environment';

export async function registerUser(input: unknown) {
  const result = registerSchema.safeParse(input);
  if (!result.success)
    return {
      ok: false as const,
      code: 'INVALID_INPUT' as const,
      fields: result.error.flatten().fieldErrors,
    };
  const { username, password } = result.data;
  const passwordHash = await hashPassword(password);
  try {
    await getDatabase().user.create({
      data: {
        username,
        usernameKey: normalizeUsername(username),
        passwordHash,
        role: 'User',
      },
    });
    return { ok: true as const };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return { ok: false as const, code: 'USERNAME_TAKEN' as const };
    }
    throw error;
  }
}

export async function authenticateUser(username: string, password: string) {
  const user = await getDatabase().user.findUnique({
    where: { usernameKey: normalizeUsername(username) },
  });
  const validPassword = await verifyPassword(
    password,
    user?.passwordHash ?? dummyPasswordHash,
  );
  if (
    !user ||
    !validPassword ||
    (user.developmentOnly && !allowsDevelopmentAccounts())
  )
    return null;
  return {
    id: user.id,
    name: user.username,
    username: user.username,
    role: user.role,
  };
}
