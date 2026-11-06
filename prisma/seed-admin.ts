import type { PrismaClient } from '../src/generated/prisma/client';
import { hashPassword } from '../src/server/auth/password';
import { allowsDevelopmentAccounts } from '../src/server/auth/environment';

export class SeedError extends Error {}

export function getAdminSeedOptions(
  environment: Record<string, string | undefined>,
  developmentPassword?: string,
) {
  const development = allowsDevelopmentAccounts(environment);
  const password =
    environment.ADMIN_PASSWORD ||
    (development ? developmentPassword : undefined);
  if (!password)
    throw new SeedError(
      'Cần ADMIN_PASSWORD; mật khẩu mặc định chỉ dùng trong Development.',
    );
  const strong =
    password.length >= 16 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
  if ((!development || environment.ADMIN_PASSWORD) && !strong)
    throw new SeedError(
      'ADMIN_PASSWORD cần 16–128 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.',
    );
  return {
    password,
    developmentOnly: !environment.ADMIN_PASSWORD,
    production: !development,
  };
}

export async function seedAdmin(
  database: PrismaClient,
  options: ReturnType<typeof getAdminSeedOptions>,
) {
  const existing = await database.user.findUnique({
    where: { usernameKey: 'admin' },
  });
  if (existing) {
    if (existing.role !== 'Administrator')
      throw new SeedError(
        'Username admin đã thuộc tài khoản User; seed không tự nâng quyền.',
      );
    if (options.production && existing.developmentOnly)
      throw new SeedError(
        'Admin Development bị chặn trên Production; hãy dùng quy trình khởi tạo an toàn riêng, seed không tự đổi tài khoản.',
      );
    return { created: false };
  }
  const passwordHash = await hashPassword(options.password);
  const user = await database.user.upsert({
    where: { usernameKey: 'admin' },
    update: {},
    create: {
      username: 'admin',
      usernameKey: 'admin',
      passwordHash,
      role: 'Administrator',
      developmentOnly: options.developmentOnly,
    },
  });
  if (
    user.role !== 'Administrator' ||
    (options.production && user.developmentOnly)
  )
    throw new SeedError(
      'Tài khoản admin tồn tại không phù hợp; không thay đổi dữ liệu.',
    );
  return { created: true };
}
