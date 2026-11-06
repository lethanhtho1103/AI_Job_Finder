import { describe, expect, it } from 'vitest';
import { getAdminSeedOptions } from '../../prisma/seed-admin';
import { developmentAdminPassword } from '../../prisma/development-admin';

describe('seed environment guards', () => {
  it('chỉ dùng mặc định trong Development local', () => {
    expect(
      getAdminSeedOptions({ NODE_ENV: 'development' }, developmentAdminPassword)
        .developmentOnly,
    ).toBe(true);
  });
  it.each([
    { NODE_ENV: 'production' },
    { NODE_ENV: 'test' },
    {},
    { NODE_ENV: 'development', VERCEL: '1' },
    { NODE_ENV: 'development', VERCEL_ENV: 'production' },
  ])('chặn mặc định ngoài Development local', (environment) => {
    expect(() =>
      getAdminSeedOptions(environment, developmentAdminPassword),
    ).toThrow();
  });
  it('từ chối ADMIN_PASSWORD yếu trên production và chấp nhận mật khẩu mạnh', () => {
    expect(() =>
      getAdminSeedOptions({
        NODE_ENV: 'production',
        ADMIN_PASSWORD: developmentAdminPassword,
      }),
    ).toThrow();
    expect(
      getAdminSeedOptions({
        NODE_ENV: 'production',
        ADMIN_PASSWORD: 'Strong-Seed-Password-2026!',
      }).developmentOnly,
    ).toBe(false);
  });
});
