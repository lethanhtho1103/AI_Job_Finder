import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth/session';
import { isAuthConfigured } from '@/server/auth/environment';
import { AuthForm } from '@/modules/auth/components/auth-form';
import { AuthScreen } from '@/modules/auth/components/auth-screen';

export const metadata: Metadata = { title: 'Đăng ký' };
export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <AuthScreen registration>
      <AuthForm mode="register" available={isAuthConfigured()} />
    </AuthScreen>
  );
}
