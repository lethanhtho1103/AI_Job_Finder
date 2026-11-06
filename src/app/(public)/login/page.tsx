import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/auth/session';
import { isAuthConfigured } from '@/server/auth/environment';
import { AuthForm } from '@/modules/auth/components/auth-form';
import { AuthScreen } from '@/modules/auth/components/auth-screen';

export const metadata: Metadata = { title: 'Đăng nhập' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  if (await getCurrentUser()) redirect('/dashboard');
  const { registered } = await searchParams;
  return (
    <AuthScreen registration={false}>
      <AuthForm
        mode="login"
        available={isAuthConfigured()}
        registered={registered === '1'}
      />
    </AuthScreen>
  );
}
