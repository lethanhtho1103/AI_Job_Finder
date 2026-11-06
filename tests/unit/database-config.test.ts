import { describe, expect, it } from 'vitest';
import { getDatabaseUrl } from '@/server/db/config';

describe('cấu hình Neon', () => {
  it('báo thiếu biến cấu hình', () => {
    expect(() => getDatabaseUrl({})).toThrow('Thiếu DATABASE_URL');
  });

  it.each([
    'invalid',
    'postgresql://USER:PASSWORD@YOUR-ENDPOINT-pooler.neon.tech/DBNAME?sslmode=require',
    'postgresql://user:secret@ep-test.neon.tech/app?sslmode=require',
    'postgresql://user:secret@ep-test-pooler.neon.tech/app',
    'https://user:secret@ep-test-pooler.neon.tech/app?sslmode=require',
  ])('từ chối cấu hình sai và không lộ giá trị kết nối', (url) => {
    try {
      getDatabaseUrl({ DATABASE_URL: url });
      expect.fail('Cấu hình phải bị từ chối');
    } catch (error) {
      expect((error as Error).message).toContain('DATABASE_URL chưa hợp lệ');
      expect((error as Error).message).not.toContain(url);
      expect((error as Error).message).not.toContain('secret');
    }
  });

  it('chấp nhận pooled URL có TLS và credentials', () => {
    const url =
      'postgresql://user:secret@ep-test-pooler.neon.tech/app?sslmode=require';
    expect(getDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });
});
