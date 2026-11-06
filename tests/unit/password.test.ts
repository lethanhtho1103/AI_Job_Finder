import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/server/auth/password';

describe('password hashing', () => {
  it('hash ngẫu nhiên, xác minh đúng và không chấp nhận hash/password sai', async () => {
    const password = 'Password with spaces 01!';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword('incorrect', first)).toBe(false);
    expect(await verifyPassword(password, 'malformed')).toBe(false);
  });
});
