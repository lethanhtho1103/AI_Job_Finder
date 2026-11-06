'use client';

import { useRef, useState, forwardRef } from 'react';
import { Alert, Button as AntButton, Form as AntForm, Input } from 'antd';
import type { InputProps, InputRef } from 'antd';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { loginSchema, registerSchema } from '../validation';

const PasswordInput = forwardRef<InputRef, InputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        {...props}
        ref={ref}
        type={visible ? 'text' : 'password'}
        suffix={
          <button
            className="password-toggle"
            type="button"
            disabled={props.disabled}
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? 'Ẩn' : 'Hiện'}
          </button>
        }
      />
    );
  },
);

type Values = { username: string; password: string; confirmPassword?: string };

export function AuthForm({
  mode,
  available,
  registered = false,
}: {
  mode: 'login' | 'register';
  available: boolean;
  registered?: boolean;
}) {
  const [form] = AntForm.useForm<Values>();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState('');
  const registration = mode === 'register';

  async function submit(values: Values) {
    if (submitting.current) return;
    setError('');
    const parsed = (registration ? registerSchema : loginSchema).safeParse(
      values,
    );
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      const entries = Object.entries(fields).map(([name, errors]) => ({
        name: name as keyof Values,
        errors,
      }));
      form.setFields(entries);
      form.scrollToField(entries[0]?.name, { focus: true });
      return;
    }
    submitting.current = true;
    setPending(true);
    let completed = false;
    try {
      if (registration) {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });
        const result = await response.json();
        if (!response.ok) {
          if (result.error?.code === 'USERNAME_TAKEN') {
            form.setFields([
              { name: 'username', errors: ['Tên đăng nhập đã được sử dụng.'] },
            ]);
            form.scrollToField('username', { focus: true });
          } else
            setError(
              result.error?.message ?? 'Không thể đăng ký. Vui lòng thử lại.',
            );
          return;
        }
        // Chuyển ranh giới auth bằng navigation đầy đủ để bỏ client/router cache.
        window.location.replace(
          new URL('/login?registered=1', window.location.origin).href,
        );
      } else {
        const result = await signIn('credentials', {
          ...parsed.data,
          redirect: false,
          callbackUrl: '/dashboard',
        });
        if (!result?.ok || result.error) {
          setError(
            result?.error === 'RATE_LIMITED'
              ? 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.'
              : result?.error === 'AUTH_UNAVAILABLE'
                ? 'Đăng nhập tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'
                : 'Tên đăng nhập hoặc mật khẩu không đúng.',
          );
          form.setFieldValue('password', '');
          form.focusField('password');
          return;
        }
        window.location.replace(
          new URL('/dashboard', window.location.origin).href,
        );
      }
      completed = true;
    } catch {
      setError('Không thể kết nối. Kiểm tra mạng và thử lại.');
    } finally {
      if (!completed) {
        submitting.current = false;
        setPending(false);
      }
    }
  }

  return (
    <div className="auth-card">
      <h2>{registration ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h2>
      <p className="text-muted">
        {registration
          ? 'Tạo một tài khoản cho hành trình tìm việc của bạn.'
          : 'Tiếp tục từ nơi bạn đã dừng lại.'}
      </p>
      <div className="auth-feedback" aria-live="polite">
        {!available ? (
          <Alert
            type="warning"
            title="Tài khoản tạm thời chưa sẵn sàng. Vui lòng thử lại sau."
          />
        ) : error ? (
          <Alert type="error" title={error} showIcon />
        ) : registered ? (
          <Alert
            type="success"
            title="Đăng ký thành công. Bạn có thể đăng nhập ngay."
            showIcon
          />
        ) : null}
      </div>
      <AntForm
        form={form}
        name={mode}
        layout="vertical"
        requiredMark={false}
        noValidate
        disabled={pending || !available}
        onFinish={submit}
        onFinishFailed={({ errorFields }) =>
          form.scrollToField(errorFields[0]?.name, { focus: true })
        }
      >
        <AntForm.Item
          name="username"
          label="Tên đăng nhập"
          extra={
            registration
              ? '3–32 ký tự: chữ không dấu, số, dấu gạch dưới. Không phân biệt hoa thường.'
              : undefined
          }
        >
          <Input
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={32}
          />
        </AntForm.Item>
        <AntForm.Item
          name="password"
          label="Mật khẩu"
          extra={
            registration ? 'Ít nhất 8 ký tự, tối đa 128 ký tự.' : undefined
          }
        >
          <PasswordInput
            disabled={pending || !available}
            autoComplete={registration ? 'new-password' : 'current-password'}
            maxLength={128}
          />
        </AntForm.Item>
        {registration && (
          <AntForm.Item name="confirmPassword" label="Xác nhận mật khẩu">
            <PasswordInput
              disabled={pending || !available}
              autoComplete="new-password"
              maxLength={128}
            />
          </AntForm.Item>
        )}
        <AntButton
          type="primary"
          htmlType="submit"
          block
          loading={pending}
          aria-busy={pending}
        >
          {registration ? 'Đăng ký' : 'Đăng nhập'}
        </AntButton>
      </AntForm>
      <p className="auth-switch">
        {registration ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
        <Link href={registration ? '/login' : '/register'}>
          {registration ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
    </div>
  );
}
