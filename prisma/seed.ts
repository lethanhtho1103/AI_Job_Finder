import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { getAdminSeedOptions, seedAdmin, SeedError } from './seed-admin';
import { allowsDevelopmentAccounts } from '../src/server/auth/environment';

async function main() {
  const development = allowsDevelopmentAccounts();
  const developmentPassword = development
    ? (await import('./development-admin')).developmentAdminPassword
    : undefined;
  const options = getAdminSeedOptions(process.env, developmentPassword);
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString)
    throw new SeedError('Thiếu DIRECT_URL hoặc DATABASE_URL.');
  const database = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 10_000,
    }),
    log: [],
  });
  try {
    const result = await seedAdmin(database, options);
    console.log(
      result.created
        ? 'Đã tạo tài khoản Administrator.'
        : 'Administrator đã tồn tại; không thay đổi tài khoản hoặc mật khẩu.',
    );
  } finally {
    await database.$disconnect();
  }
}

try {
  await main();
} catch (error) {
  // Lỗi nghiệp vụ trên không chứa credentials; lỗi DB chỉ trả thông báo chung.
  const message =
    error instanceof SeedError
      ? error.message
      : 'Không thể seed Admin. Kiểm tra cấu hình database và migration.';
  console.error(message);
  process.exitCode = 1;
}
