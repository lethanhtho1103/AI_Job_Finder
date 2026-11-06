import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { getDatabase } from '@/server/db/client';
import { getAuthSecret } from './environment';

export class RateLimitError extends Error {
  constructor() {
    super('RATE_LIMITED');
  }
}

export function getClientAddress(
  headers: Record<string, string | string[] | undefined>,
) {
  // Chỉ tin header được Vercel ghi đè. Local/self-host dùng bucket chung,
  // không tin x-forwarded-for tùy ý do client gửi để vượt giới hạn.
  const value =
    process.env.VERCEL === '1' ? headers['x-vercel-forwarded-for'] : undefined;
  const address = typeof value === 'string' ? value.split(',')[0].trim() : '';
  return isIP(address) ? address : 'shared';
}

export async function consumeRateLimit(
  scope: string,
  target: string,
  limit: number,
  windowSeconds: number,
) {
  const key = createHmac('sha256', getAuthSecret())
    .update(`${scope}:${target}`)
    .digest('hex');
  const database = getDatabase();
  const rows = await database.$queryRaw<{ count: number }[]>`
    INSERT INTO "AuthRateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, NOW() + ${windowSeconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN EXCLUDED."expiresAt" ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "count"
  `;
  if (rows[0].count > limit) throw new RateLimitError();
}
