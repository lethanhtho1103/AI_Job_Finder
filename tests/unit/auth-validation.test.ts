import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  normalizeUsername,
  registerSchema,
} from '@/modules/auth/validation';

const valid = {
  username: 'Alice_01',
  password: 'valid-password',
  confirmPassword: 'valid-password',
};

describe('username/password validation', () => {
  it('chuẩn hóa username hoa thường và khoảng trắng', () => {
    expect(normalizeUsername(' Alice_01 ')).toBe('alice_01');
    expect(
      registerSchema.parse({ ...valid, username: ' Alice_01 ' }).username,
    ).toBe('Alice_01');
  });
  it.each(['ab', 'a'.repeat(33), '_alice', 'a b', 'tên', 'alice@example.com'])(
    'từ chối username sai: %s',
    (username) => {
      expect(registerSchema.safeParse({ ...valid, username }).success).toBe(
        false,
      );
    },
  );
  it('không cho đăng ký password ngắn, confirm sai hoặc role tự chọn', () => {
    expect(
      registerSchema.safeParse({
        ...valid,
        password: '123456',
        confirmPassword: '123456',
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, confirmPassword: 'different' })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, role: 'Administrator' }).success,
    ).toBe(false);
  });
  it('không trim mật khẩu và cho tài khoản development đăng nhập password ngắn', () => {
    expect(
      loginSchema.parse({ username: 'admin', password: '123456' }).password,
    ).toBe('123456');
    expect(
      registerSchema.parse({
        ...valid,
        password: ' password ',
        confirmPassword: ' password ',
      }).password,
    ).toBe(' password ');
  });
});
