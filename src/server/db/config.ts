import { z } from 'zod';

const databaseUrlSchema = z
  .string()
  .url()
  .superRefine((value, context) => {
    if (!URL.canParse(value)) return;
    const url = new URL(value);
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !url.hostname.endsWith('-pooler.neon.tech') ||
      !url.username ||
      !url.password ||
      url.pathname.length < 2 ||
      url.searchParams.get('sslmode') !== 'require' ||
      /YOUR-ENDPOINT|USER:PASSWORD|DBNAME/i.test(value)
    ) {
      context.addIssue({ code: 'custom', message: 'Invalid pooled Neon URL' });
    }
  });

export function getDatabaseUrl(environment: { DATABASE_URL?: string }): string {
  if (!environment.DATABASE_URL?.trim()) {
    throw new Error(
      'Thiếu DATABASE_URL. Hãy cấu hình pooled connection URL của Neon trong .env.',
    );
  }
  const result = databaseUrlSchema.safeParse(environment.DATABASE_URL);
  if (!result.success) {
    // Không trả Zod error: có thể chứa input hoặc thông tin kết nối nhạy cảm.
    throw new Error(
      'DATABASE_URL chưa hợp lệ. Cần URL Neon pooled thật, tài khoản, database và sslmode=require.',
    );
  }
  return result.data;
}
