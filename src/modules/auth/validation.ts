import { z } from 'zod';

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Tên đăng nhập cần từ 3 đến 32 ký tự.')
  .max(32, 'Tên đăng nhập cần từ 3 đến 32 ký tự.')
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9_]*$/,
    'Chỉ dùng chữ cái không dấu, số và dấu gạch dưới; bắt đầu bằng chữ hoặc số.',
  );

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
  .max(128, 'Mật khẩu tối đa 128 ký tự.');

export const registerSchema = z
  .object({
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận chưa khớp.',
  });

// Cho phép tài khoản development cũ có mật khẩu 6 ký tự đăng nhập.
// Độ dài đăng ký mới vẫn được kiểm tra độc lập ở registerSchema.
export const loginSchema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.')
    .max(128, 'Mật khẩu tối đa 128 ký tự.'),
});

export const normalizeUsername = (username: string) =>
  username.trim().toLowerCase();
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
