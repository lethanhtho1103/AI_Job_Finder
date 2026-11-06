import 'server-only';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalDatabase = globalThis as unknown as { prisma?: PrismaClient };

export function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_UNAVAILABLE');
  if (!globalDatabase.prisma) {
    globalDatabase.prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
      }),
      // Không bật query logging vì queries auth chứa dữ liệu nhạy cảm.
      log: [],
    });
  }
  return globalDatabase.prisma;
}
