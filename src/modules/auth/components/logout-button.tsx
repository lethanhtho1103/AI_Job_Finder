'use client';

import { useRef, useState } from 'react';
import { Button } from 'antd';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  async function logout() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const response = await signOut({
        redirect: false,
        callbackUrl: '/login',
      });
      if (!response?.url) throw new Error('SIGN_OUT_FAILED');
      // Xóa router cache của nội dung đã đăng nhập trước khi về Login.
      window.location.replace(new URL('/login', window.location.origin).href);
    } catch {
      setError('Không thể đăng xuất. Vui lòng thử lại.');
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <div className="logout-control">
      <Button
        onClick={logout}
        loading={pending}
        disabled={pending}
        aria-busy={pending}
      >
        Đăng xuất
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
